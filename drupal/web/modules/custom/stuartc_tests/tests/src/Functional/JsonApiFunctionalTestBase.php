<?php

namespace Drupal\Tests\stuartc_tests\Functional;

use Drupal\Tests\BrowserTestBase;
use Drupal\taxonomy\Entity\Vocabulary;
use Drupal\taxonomy\Entity\Term;
use Drupal\node\Entity\NodeType;
use Drupal\node\Entity\Node;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;
use Drupal\Core\Entity\Entity\EntityViewDisplay;

/**
 * Shared fixtures for JSON:API contract tests.
 *
 * Grants the anonymous role the same permission set as the real site's
 * committed `config/sync/user.role.anonymous.yml` (BrowserTestBase always
 * runs against its own throwaway install, never the real site database —
 * see wiki/testing-guide.md), and provides helpers for the article_type/
 * article_category vocabularies both tests need.
 *
 * @group jsonapi
 * @group stuartc_tests
 */
abstract class JsonApiFunctionalTestBase extends BrowserTestBase {

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'system',
    'user',
    'node',
    'taxonomy',
    'field',
    'text',
    'filter',
    'path',
    'path_alias',
    'serialization',
    'jsonapi',
    'jsonapi_hypermedia',
    'file',
    'image',
    'media',
    'paragraphs',
    'paragraphs_type_permissions',
    'entity_reference_revisions',
    'block_content',
    'config_pages',
    'menu_link_content',
    'jsonapi_menu_items',
    'decoupled_router',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    // Matches config/sync/user.role.anonymous.yml's real permission set —
    // the subset relevant to entity types these tests exercise. The real
    // site also grants "view paragraph content <bundle>" for all 9
    // paragraph bundles, but those are dynamically-generated permissions
    // (see paragraphs_type_permissions module) that only exist once the
    // corresponding ParagraphsType is created — granting one for a bundle
    // that doesn't exist yet is itself deprecated in Drupal core and a
    // hard error from Drupal 10 onward. Use grantParagraphViewPermission()
    // per-bundle, after creating it, instead.
    user_role_grant_permissions(\Drupal\user\RoleInterface::ANONYMOUS_ID, [
      'access content',
      'view media',
    ]);
  }

  /**
   * Grants "view paragraph content <bundle>" for an already-created bundle.
   *
   * Must run after the corresponding ParagraphsType is saved: the
   * permission is generated dynamically per existing bundle (see
   * paragraphs_type_permissions module), so granting it any earlier is
   * itself deprecated in Drupal core.
   */
  protected function grantParagraphViewPermission(string $bundle): void {
    user_role_grant_permissions(\Drupal\user\RoleInterface::ANONYMOUS_ID, [
      "view paragraph content $bundle",
    ]);
  }

  /**
   * Creates the real site's article_type and article_category vocabularies.
   *
   * @return array
   *   ['article_type' => Vocabulary, 'article_category' => Vocabulary].
   */
  protected function createArticleVocabularies(): array {
    $vocabularies = [];
    foreach (['article_type', 'article_category'] as $vid) {
      $vocabularies[$vid] = Vocabulary::create([
        'vid' => $vid,
        'name' => $vid,
      ]);
      $vocabularies[$vid]->save();
    }
    return $vocabularies;
  }

  /**
   * Creates a taxonomy term in the given vocabulary.
   */
  protected function createTerm(string $vocabulary, string $name): Term {
    $term = Term::create([
      'vid' => $vocabulary,
      'name' => $name,
    ]);
    $term->save();
    return $term;
  }

  /**
   * Creates the "article" content type with the real site's core fields.
   *
   * Only the fields these tests actually exercise (matching
   * config/sync/field.field.node.article.*.yml) — field_display_title,
   * field_image, field_meta_tags, field_video are omitted since no test
   * here depends on them.
   */
  protected function createArticleContentType(): NodeType {
    $type = NodeType::create(['type' => 'article', 'name' => 'Article']);
    $type->save();

    FieldStorageConfig::create([
      'field_name' => 'field_description',
      'entity_type' => 'node',
      'type' => 'string_long',
    ])->save();
    FieldConfig::create([
      'field_name' => 'field_description',
      'entity_type' => 'node',
      'bundle' => 'article',
      'label' => 'Description',
    ])->save();

    FieldStorageConfig::create([
      'field_name' => 'field_article_type',
      'entity_type' => 'node',
      'type' => 'entity_reference',
      'settings' => ['target_type' => 'taxonomy_term'],
    ])->save();
    FieldConfig::create([
      'field_name' => 'field_article_type',
      'entity_type' => 'node',
      'bundle' => 'article',
      'label' => 'Article type',
      'settings' => ['handler_settings' => ['target_bundles' => ['article_type' => 'article_type']]],
    ])->save();

    FieldStorageConfig::create([
      'field_name' => 'field_article_category',
      'entity_type' => 'node',
      'type' => 'entity_reference',
      'cardinality' => -1,
      'settings' => ['target_type' => 'taxonomy_term'],
    ])->save();
    FieldConfig::create([
      'field_name' => 'field_article_category',
      'entity_type' => 'node',
      'bundle' => 'article',
      'label' => 'Article category',
      'settings' => ['handler_settings' => ['target_bundles' => ['article_category' => 'article_category']]],
    ])->save();

    FieldStorageConfig::create([
      'field_name' => 'field_content',
      'entity_type' => 'node',
      'type' => 'entity_reference_revisions',
      'cardinality' => -1,
      'settings' => ['target_type' => 'paragraph'],
    ])->save();
    FieldConfig::create([
      'field_name' => 'field_content',
      'entity_type' => 'node',
      'bundle' => 'article',
      'label' => 'Content',
      'settings' => ['handler_settings' => ['negate' => 0]],
    ])->save();

    EntityViewDisplay::create([
      'targetEntityType' => 'node',
      'bundle' => 'article',
      'mode' => 'default',
      'status' => TRUE,
    ])->save();

    return $type;
  }

  /**
   * Creates a published "article" node.
   *
   * @param array $values
   *   Additional/override field values merged into the defaults.
   */
  protected function createArticleNode(array $values = []): Node {
    $node = Node::create($values + [
      'type' => 'article',
      'title' => 'Test article',
      'status' => 1,
    ]);
    $node->save();
    return $node;
  }

  /**
   * Performs a GET request against a JSON:API URL and decodes the response.
   *
   * Rebuilds the router first: fixtures created earlier in the test (content
   * types, vocabularies, media/block/config_pages bundles) mark the router
   * dirty only in this process's in-memory RouteBuilder state. That flag is
   * normally flushed to the persisted router table when the request that set
   * it terminates — but fixture setup here runs directly against the test
   * kernel, not through an HTTP request/response cycle, so nothing ever
   * flushes it. drupalGet() below is a real HTTP request to the separately
   * running webserver process, which reads the router table fresh and would
   * 404 on any route tied to a bundle created after the table was last built.
   *
   * Splits off any query string and passes it via drupalGet()'s $options —
   * drupalGet() builds the request URL from the path string as-is, so a
   * literal "?include=..." left in $path gets percent-encoded into the path
   * itself (e.g. "/jsonapi/node/article%3Finclude%3D...") instead of being
   * sent as a real query string, which 404s every time.
   *
   * @return array
   *   ['status' => int, 'body' => array|null].
   */
  protected function getJsonApi(string $path): array {
    \Drupal::service('router.builder')->rebuild();
    [$base_path, $query_string] = array_pad(explode('?', $path, 2), 2, '');
    $options = [];
    if ($query_string !== '') {
      parse_str($query_string, $query);
      $options['query'] = $query;
    }
    $this->drupalGet($base_path, $options);
    $status = $this->getSession()->getStatusCode();
    $content = $this->getSession()->getPage()->getContent();
    $body = $content ? json_decode($content, TRUE) : NULL;
    return ['status' => $status, 'body' => $body];
  }

}
