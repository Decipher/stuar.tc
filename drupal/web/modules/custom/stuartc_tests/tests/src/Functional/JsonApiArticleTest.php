<?php

namespace Drupal\Tests\stuartc_tests\Functional;

use Drupal\paragraphs\Entity\Paragraph;
use Drupal\paragraphs\Entity\ParagraphsType;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

/**
 * Tests the `node--article` JSON:API contract nuxt/scripts/sync-content.mjs
 * depends on: the collection endpoint, and includes for
 * field_article_category/field_article_type/field_content.
 *
 * @group jsonapi
 * @group stuartc_tests
 */
class JsonApiArticleTest extends JsonApiFunctionalTestBase {

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->createArticleContentType();
    $this->createArticleVocabularies();

    ParagraphsType::create(['id' => 'text_formatted', 'label' => 'Text'])->save();
    $this->grantParagraphViewPermission('text_formatted');

    FieldStorageConfig::create([
      'field_name' => 'field_text_formatted',
      'entity_type' => 'paragraph',
      'type' => 'text_long',
    ])->save();
    FieldConfig::create([
      'field_name' => 'field_text_formatted',
      'entity_type' => 'paragraph',
      'bundle' => 'text_formatted',
      'label' => 'Text',
    ])->save();
  }

  /**
   * Tests that the article collection endpoint returns 200 with expected shape.
   */
  public function testArticleCollection() {
    $this->createArticleNode([
      'title' => 'Hello world',
      'field_description' => 'A description.',
    ]);

    $result = $this->getJsonApi('/jsonapi/node/article');
    $this->assertEquals(200, $result['status']);
    $this->assertNotEmpty($result['body']['data']);

    $resource = $result['body']['data'][0];
    $this->assertEquals('node--article', $resource['type']);
    $this->assertEquals('Hello world', $resource['attributes']['title']);
    $this->assertArrayHasKey('created', $resource['attributes']);
    $this->assertArrayHasKey('path', $resource['attributes']);
    $this->assertEquals('A description.', $resource['attributes']['field_description']);
    $this->assertArrayHasKey('field_article_category', $resource['relationships']);
    $this->assertArrayHasKey('field_article_type', $resource['relationships']);
    $this->assertArrayHasKey('field_content', $resource['relationships']);
  }

  /**
   * Tests that ?include=field_article_category,field_article_type resolves
   * taxonomy term includes with a `name` attribute — the shape
   * sync-content.mjs's resolveRelationships()/buildArticle() expect.
   */
  public function testArticleTaxonomyIncludes() {
    $type_term = $this->createTerm('article_type', 'Blog post');
    $category_term = $this->createTerm('article_category', 'Drupal');

    $this->createArticleNode([
      'field_article_type' => [['target_id' => $type_term->id()]],
      'field_article_category' => [['target_id' => $category_term->id()]],
    ]);

    $result = $this->getJsonApi('/jsonapi/node/article?include=field_article_category,field_article_type');
    $this->assertEquals(200, $result['status']);

    $included = $result['body']['included'] ?? [];
    $this->assertNotEmpty($included, 'Expected included taxonomy term resources.');
    $names = array_column(array_column($included, 'attributes'), 'name');
    $this->assertContains('Blog post', $names);
    $this->assertContains('Drupal', $names);
  }

  /**
   * Tests that ?include=field_content resolves paragraph includes — the
   * shape sync-content.mjs's buildParagraph() expects for the paragraph tree.
   */
  public function testArticleParagraphInclude() {
    $paragraph = Paragraph::create([
      'type' => 'text_formatted',
      'field_text_formatted' => ['value' => '<p>Hello</p>', 'format' => 'basic_html'],
    ]);
    $paragraph->save();

    $this->createArticleNode([
      'field_content' => [$paragraph],
    ]);

    $result = $this->getJsonApi('/jsonapi/node/article?include=field_content');
    $this->assertEquals(200, $result['status']);

    $included = $result['body']['included'] ?? [];
    $types = array_column($included, 'type');
    $this->assertContains('paragraph--text_formatted', $types);
  }

}
