<?php

namespace Drupal\stuartc_related\Normalizer;

use Drupal\Core\Entity\EntityRepositoryInterface;
use Drupal\Core\Field\Plugin\Field\FieldType\EntityReferenceItem;
use Drupal\serialization\Normalizer\EntityReferenceFieldItemNormalizer;
use Drupal\stuartc_related\EventSubscriber\TomeRelatedSubscriber;

/**
 * Lets a Tome import skip "Read next" picks whose target is not there yet.
 *
 * Mutual picks (A picks B, B picks A) would be a dependency cycle, so the
 * subscriber keeps field_related out of Tome's import graph. A node can then
 * be imported before the node it picks. This normalizer claims only
 * field_related items, and only while Tome is importing: a target that
 * exists resolves as usual, a missing one leaves the item empty instead of
 * failing the whole node. TomeRelatedSubscriber restores the full, ordered
 * field once every node exists. Every other reference, and field_related
 * outside an import, goes to the normalizers that handled it before.
 *
 * @see \Drupal\stuartc_related\EventSubscriber\TomeRelatedSubscriber
 */
class DeferredReferenceItemNormalizer extends EntityReferenceFieldItemNormalizer {

  /**
   * Constructs a DeferredReferenceItemNormalizer.
   *
   * @param \Drupal\Core\Entity\EntityRepositoryInterface $entity_repository
   *   The entity repository.
   * @param \Closure $importer
   *   Returns the Tome importer, to know whether an import is running. A
   *   closure, because the importer itself depends on the serializer.
   */
  public function __construct(EntityRepositoryInterface $entity_repository, protected \Closure $importer) {
    parent::__construct($entity_repository);
  }

  /**
   * {@inheritdoc}
   */
  public function getSupportedTypes(?string $format): array {
    // Not cacheable: whether an item is claimed depends on its field and on
    // whether an import is running.
    return [EntityReferenceItem::class => FALSE];
  }

  /**
   * {@inheritdoc}
   */
  public function supportsNormalization($data, ?string $format = NULL, array $context = []): bool {
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function supportsDenormalization($data, string $type, ?string $format = NULL, array $context = []): bool {
    $field_item = $context['target_instance'] ?? NULL;
    return $field_item instanceof EntityReferenceItem
      && in_array($field_item->getFieldDefinition()->getName(), TomeRelatedSubscriber::DEFERRED_FIELDS, TRUE)
      && ($this->importer)()->isImporting()
      && parent::supportsDenormalization($data, $type, $format, $context);
  }

  /**
   * {@inheritdoc}
   */
  protected function constructValue($data, $context) {
    if (!empty($data['target_uuid'])) {
      $target_type = $context['target_instance']->getFieldDefinition()->getSetting('target_type');
      $target = $this->entityRepository->loadEntityByUuid($target_type, $data['target_uuid']);
      // An empty item is filtered out on save, and restored after the import.
      return ['target_id' => $target?->id()];
    }
    return parent::constructValue($data, $context);
  }

}
