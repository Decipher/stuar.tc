<?php

namespace Drupal\Tests\stuartc_tests\Kernel;

use Drupal\Component\EventDispatcher\Event;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;
use Drupal\Tests\tome_base\Kernel\TestBase;
use Drupal\tome_sync\Event\TomeSyncEvents;
use Drupal\tome_sync\TomeSyncHelper;

/**
 * Tests that mutual "Read next" picks survive a Tome export and import.
 *
 * Tome orders an import by each entity's references and refuses a cycle, so
 * two articles picking each other used to break tome:install. The
 * stuartc_related Tome integration keeps field_related out of the import
 * graph and restores it once every node exists.
 *
 * @group tome
 * @group stuartc_tests
 */
class TomeRelatedTest extends TestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'tome_base',
    'tome_sync',
    'taxonomy',
    'views',
    'stuartc_related',
  ];

  /**
   * {@inheritdoc}
   */
  public function setUp(): void {
    parent::setUp();
    $this->installSchema('tome_sync', ['tome_sync_content_hash']);
    $this->createEntityReferenceField('node', 'article', 'field_related', 'Read next', 'node', 'default', ['target_bundles' => ['article' => 'article']], -1);
  }

  /**
   * Creates and saves an article; Tome exports it on save.
   *
   * @param string $title
   *   The title.
   *
   * @return \Drupal\node\NodeInterface
   *   The article.
   */
  protected function article(string $title): NodeInterface {
    $node = Node::create(['type' => 'article', 'title' => $title]);
    $node->save();
    return $node;
  }

  /**
   * Returns the titles of an article's picks, in order.
   *
   * @param string $uuid
   *   The article UUID.
   *
   * @return string[]
   *   Picked article titles.
   */
  protected function picks(string $uuid): array {
    $node = \Drupal::service('entity.repository')->loadEntityByUuid('node', $uuid);
    return array_map(fn($target) => $target->label(), $node->get('field_related')->referencedEntities());
  }

  /**
   * Tests a mutual pick round trip through Tome.
   */
  public function testMutualPicksRoundTrip(): void {
    $a = $this->article('A');
    $b = $this->article('B');
    $c = $this->article('C');
    $a->set('field_related', [$b, $c])->save();
    $b->set('field_related', [$a])->save();
    $c->set('field_related', [$a])->save();

    // The field values are exported, but are not import dependencies.
    $storage = \Drupal::service('tome_sync.storage.content');
    $exported = $storage->read(TomeSyncHelper::getContentName($a));
    $this->assertSame([$b->uuid(), $c->uuid()], array_column($exported['field_related'], 'target_uuid'));
    $index = json_decode(file_get_contents($this->siteDirectory . '/files/tome/content/meta/index.json'), TRUE);
    foreach ([$a, $b, $c] as $node) {
      $this->assertSame([], array_filter($index[TomeSyncHelper::getContentName($node)], fn($dep) => str_starts_with($dep, 'node.')));
    }

    // Tome can now order the import: this threw on the cycle before.
    $importer = \Drupal::service('tome_sync.importer');
    $chunks = $importer->getChunkedNames();

    // Start from an empty site, as tome:install does.
    $uuids = [$a->uuid(), $b->uuid(), $c->uuid()];
    $importer->isImporting(TRUE);
    foreach ([$a, $b, $c] as $node) {
      $node->delete();
    }
    $importer->isImporting(FALSE);

    foreach ($chunks as $chunk) {
      foreach ($chunk as $name) {
        [$entity_type_id, $uuid] = explode('.', $name, 2);
        $importer->importContent($entity_type_id, $uuid);
      }
    }
    // A and B pick each other, so one was imported before the other and had
    // that pick held back rather than failing: fewer than all four resolve.
    $resolved = count($this->picks($uuids[0])) + count($this->picks($uuids[1])) + count($this->picks($uuids[2]));
    $this->assertLessThan(4, $resolved);

    \Drupal::service('event_dispatcher')->dispatch(new Event(), TomeSyncEvents::IMPORT_ALL);
    $this->assertSame(['B', 'C'], $this->picks($uuids[0]));
    $this->assertSame(['A'], $this->picks($uuids[1]));
    $this->assertSame(['A'], $this->picks($uuids[2]));
  }

  /**
   * Tests that a missing pick still fails outside an import.
   */
  public function testMissingTargetOutsideImportStillFails(): void {
    $this->expectException(\InvalidArgumentException::class);
    \Drupal::service('serializer')->denormalize([
      'type' => [['target_id' => 'article']],
      'title' => [['value' => 'D']],
      'field_related' => [['target_type' => 'node', 'target_uuid' => \Drupal::service('uuid')->generate()]],
    ], Node::class, 'json');
  }

}
