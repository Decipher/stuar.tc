<?php

namespace Drupal\Tests\stuartc_tests\Kernel;

use Drupal\KernelTests\KernelTestBase;

/**
 * Verifies the real committed Tome content export (drupal/content/*.json) —
 * the actual data `.devtools/provision`'s `drush tome:install` imports —
 * is structurally sane: at least N article nodes with non-empty titles and
 * path aliases, the two article taxonomy vocabularies have terms, etc.
 *
 * Deliberately reads the committed JSON files directly rather than running
 * a full Tome import inside an isolated test database: tome_sync's importer
 * is designed around drush sub-process orchestration (config import, then
 * chunked content import via `tome:import-content` sub-processes — see
 * \Drupal\tome_sync\Commands\ImportCommand) which doesn't translate cleanly
 * into a single in-process PHPUnit run. A real import IS exercised every
 * time `.devtools/provision`/`sync:drupal-content` runs — this test instead
 * guards against a corrupted or truncated content export reaching git,
 * independent of that.
 *
 * @group tome
 * @group stuartc_tests
 */
class TomeContentTest extends KernelTestBase {

  /**
   * The real Tome content export directory.
   *
   * @var string
   */
  protected string $contentDir;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    // drupal/content, relative to this module's own location.
    $this->contentDir = dirname(__DIR__, 7) . '/content';
  }

  /**
   * Reads and decodes every content file of a given entity type prefix.
   *
   * @return array<string, array>
   *   Decoded JSON keyed by filename.
   */
  protected function readContentFiles(string $prefix): array {
    $files = glob($this->contentDir . '/' . $prefix . '.*.json') ?: [];
    $decoded = [];
    foreach ($files as $file) {
      $data = json_decode((string) file_get_contents($file), TRUE);
      $this->assertIsArray($data, "$file should contain valid JSON.");
      $decoded[basename($file)] = $data;
    }
    return $decoded;
  }

  /**
   * Tests that at least 4 article nodes exist with titles and path aliases.
   */
  public function testArticleNodesExist() {
    $nodes = $this->readContentFiles('node');
    $articles = array_filter($nodes, fn(array $n) => ($n['type'][0]['target_id'] ?? NULL) === 'article');

    $this->assertGreaterThanOrEqual(4, count($articles), 'Expected at least 4 article nodes in the committed content export.');

    foreach ($articles as $filename => $node) {
      $this->assertNotEmpty(
        $node['title'][0]['value'] ?? NULL,
        "$filename should have a non-empty title."
      );
    }
  }

  /**
   * Tests that path_alias content entities exist for the articles.
   */
  public function testPathAliasesExist() {
    $aliases = $this->readContentFiles('path_alias');
    $this->assertGreaterThanOrEqual(4, count($aliases), 'Expected at least 4 path_alias entities (one per legacy article + the new one).');

    foreach ($aliases as $filename => $alias) {
      $alias_value = $alias['alias'][0]['value'] ?? NULL;
      $this->assertNotEmpty($alias_value, "$filename should have a non-empty alias.");
      $this->assertStringStartsWith('/writing/', $alias_value, "$filename's alias should follow the /writing/<slug>-<date> convention.");
    }
  }

  /**
   * Tests that both article taxonomy vocabularies have at least one term.
   */
  public function testArticleTaxonomyTermsExist() {
    $terms = $this->readContentFiles('taxonomy_term');
    $this->assertNotEmpty($terms, 'Expected at least one taxonomy_term content file.');

    $vocabularies = array_unique(array_map(fn(array $t) => $t['vid'][0]['target_id'] ?? NULL, $terms));
    $this->assertContains('article_type', $vocabularies, 'Expected at least one article_type term.');
    $this->assertContains('article_category', $vocabularies, 'Expected at least one article_category term.');
  }

  /**
   * Tests that the druxt_settings config_pages entity exists with content.
   */
  public function testDruxtSettingsConfigPageExists() {
    $config_pages = $this->readContentFiles('config_pages');
    $druxt_settings = array_filter($config_pages, fn(array $c) => ($c['type'][0]['target_id'] ?? NULL) === 'druxt_settings');

    $this->assertNotEmpty($druxt_settings, 'Expected a druxt_settings config_pages entity in the committed content export.');
  }

}
