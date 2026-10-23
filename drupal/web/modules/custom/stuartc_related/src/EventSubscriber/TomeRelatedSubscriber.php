<?php

namespace Drupal\stuartc_related\EventSubscriber;

use Drupal\Core\Config\StorageInterface;
use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Entity\EntityRepositoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Field\EntityReferenceFieldItemListInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Entity\SynchronizableInterface;
use Drupal\tome_sync\ContentIndexerTrait;
use Drupal\tome_sync\Event\ContentCrudEvent;
use Drupal\tome_sync\Event\TomeSyncEvents;
use Drupal\tome_sync\ImporterInterface;
use Drupal\tome_sync\TomeSyncHelper;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Keeps "Read next" picks out of Tome's import graph, and restores them.
 *
 * Tome orders an import by the entity references each exported entity holds
 * (meta/index.json), and refuses a graph with a cycle. field_related links
 * articles to each other, and mutual picks are intended, so:
 *
 * - On export, this drops the field_related targets from the node's index
 *   entry (unless another field also references them). Tome has no
 *   dependency-alter hook; the EXPORT_CONTENT event fires right after the
 *   entry is written, so it is rewritten here under Tome's own index lock.
 * - On import, DeferredReferenceItemNormalizer leaves a pick empty when its
 *   target is not imported yet, and once the whole import is done
 *   (IMPORT_ALL, which tome:import and tome:install both dispatch) this sets
 *   every node's field_related again from its exported JSON, in order.
 */
class TomeRelatedSubscriber implements EventSubscriberInterface {

  use ContentIndexerTrait;

  /**
   * Entity reference fields that are not import dependencies.
   */
  public const DEFERRED_FIELDS = ['field_related'];

  /**
   * Constructs a TomeRelatedSubscriber.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\tome_sync\ImporterInterface $importer
   *   The Tome importer.
   * @param \Drupal\Core\Config\StorageInterface $contentStorage
   *   Tome's content storage, the exported JSON.
   * @param \Drupal\Core\File\FileSystemInterface $fileSystem
   *   The file system, used by ContentIndexerTrait.
   * @param \Drupal\Core\Entity\EntityRepositoryInterface $entityRepository
   *   The entity repository, to resolve exported UUIDs.
   */
  public function __construct(
    protected EntityTypeManagerInterface $entityTypeManager,
    protected ImporterInterface $importer,
    protected StorageInterface $contentStorage,
    protected FileSystemInterface $fileSystem,
    protected EntityRepositoryInterface $entityRepository,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    return [
      TomeSyncEvents::EXPORT_CONTENT => ['removeDeferredDependencies'],
      TomeSyncEvents::IMPORT_ALL => ['restoreDeferredReferences'],
    ];
  }

  /**
   * Drops deferred-field targets from an exported entity's index entry.
   *
   * @param \Drupal\tome_sync\Event\ContentCrudEvent $event
   *   The export event.
   */
  public function removeDeferredDependencies(ContentCrudEvent $event): void {
    $entity = $event->getContent();
    $deferred = [];
    $kept = [];
    foreach ($entity as $field_name => $field) {
      if (!$field instanceof EntityReferenceFieldItemListInterface) {
        continue;
      }
      foreach ($field->referencedEntities() as $referenced) {
        if ($referenced instanceof ContentEntityInterface) {
          if (in_array($field_name, static::DEFERRED_FIELDS, TRUE)) {
            $deferred[] = TomeSyncHelper::getContentName($referenced);
          }
          else {
            $kept[] = TomeSyncHelper::getContentName($referenced);
          }
        }
      }
    }
    $drop = array_diff($deferred, $kept);
    if (!$drop) {
      return;
    }
    $name = TomeSyncHelper::getContentName($entity);
    $handle = $this->acquireContentIndexLock();
    $index = json_decode((string) stream_get_contents($handle), TRUE) ?: [];
    if (isset($index[$name])) {
      $index[$name] = array_values(array_diff($index[$name], $drop));
      ftruncate($handle, 0);
      rewind($handle);
      fwrite($handle, json_encode($index, JSON_PRETTY_PRINT));
    }
    flock($handle, LOCK_UN);
  }

  /**
   * Sets every deferred field from the exported JSON, once all nodes exist.
   */
  public function restoreDeferredReferences(): void {
    $storage = $this->entityTypeManager->getStorage('node');
    $this->importer->isImporting(TRUE);
    try {
      foreach ($this->contentStorage->listAll('node.') as $name) {
        $data = $this->contentStorage->read($name);
        $uuid = $data['uuid'][0]['value'] ?? NULL;
        $loaded = $uuid ? $storage->loadByProperties(['uuid' => $uuid]) : [];
        $node = reset($loaded);
        if (!$node) {
          continue;
        }
        $changed = FALSE;
        foreach (static::DEFERRED_FIELDS as $field_name) {
          if (!isset($data[$field_name]) || !$node->hasField($field_name)) {
            continue;
          }
          $target_type = $node->getFieldDefinition($field_name)->getSetting('target_type');
          $values = [];
          foreach ($data[$field_name] as $item) {
            $target = !empty($item['target_uuid']) ? $this->entityRepository->loadEntityByUuid($target_type, $item['target_uuid']) : NULL;
            if ($target) {
              $values[] = ['target_id' => $target->id()];
            }
          }
          $current = array_map(fn($item) => ['target_id' => $item['target_id']], $node->get($field_name)->getValue());
          if ($current != $values) {
            $node->set($field_name, $values);
            $changed = TRUE;
          }
        }
        if ($changed) {
          // Not a content change: keep "changed" as exported.
          if ($node instanceof SynchronizableInterface) {
            $node->setSyncing(TRUE);
          }
          $node->save();
        }
      }
    }
    finally {
      $this->importer->isImporting(FALSE);
    }
  }

}
