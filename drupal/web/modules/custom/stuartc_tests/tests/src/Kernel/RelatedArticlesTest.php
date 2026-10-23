<?php

namespace Drupal\Tests\stuartc_tests\Kernel;

use Drupal\Component\Serialization\Json;
use Drupal\Component\Serialization\Yaml;
use Drupal\KernelTests\KernelTestBase;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\node\NodeInterface;
use Drupal\taxonomy\Entity\Term;
use Drupal\user\Entity\Role;
use Drupal\user\RoleInterface;
use Drupal\views\Views;
use Symfony\Component\HttpFoundation\Request;

/**
 * Tests the "Read next" backend: field_related, field_topics, field_public and the view.
 *
 * Builds the fields and the related_articles view from the real committed
 * config/sync YAML, so a broken or drifted export fails here rather than at
 * the next sync. Covers the contract nuxt/scripts/sync-content.mjs and
 * push-story.mjs rely on: field_related keeps its order over JSON:API, both
 * ways; the view ranks by shared topics, then shared categories, then date,
 * takes posts sharing either, and leaves out the excluded nodes, unpublished
 * and future-dated posts, and any term that is not passed to it.
 *
 * @group jsonapi
 * @group stuartc_tests
 */
class RelatedArticlesTest extends KernelTestBase {

  /**
   * Modules to enable.
   *
   * @var array
   */
  protected static $modules = [
    'system',
    'user',
    'node',
    'field',
    'text',
    'filter',
    'file',
    'taxonomy',
    'datetime',
    'views',
    'serialization',
    'jsonapi',
    'jsonapi_resources',
    'jsonapi_views',
    'stuartc_related',
  ];

  /**
   * Committed config, in dependency order.
   *
   * @var string[]
   */
  protected const CONFIG = [
    'taxonomy_vocabulary' => 'taxonomy.vocabulary.article_category',
    'taxonomy_vocabulary:topic' => 'taxonomy.vocabulary.article_topic',
    'field_storage_config:category' => 'field.storage.node.field_article_category',
    'field_config:category' => 'field.field.node.article.field_article_category',
    'field_storage_config:published' => 'field.storage.node.field_published',
    'field_config:published' => 'field.field.node.article.field_published',
    'field_storage_config:related' => 'field.storage.node.field_related',
    'field_config:related' => 'field.field.node.article.field_related',
    'field_storage_config:topics' => 'field.storage.node.field_topics',
    'field_config:topics' => 'field.field.node.article.field_topics',
    'field_storage_config:public' => 'field.storage.taxonomy_term.field_public',
    'field_config:public' => 'field.field.taxonomy_term.article_category.field_public',
    'view' => 'views.view.related_articles',
  ];

  /**
   * Category and topic terms, keyed by name.
   *
   * @var \Drupal\taxonomy\TermInterface[]
   */
  protected array $terms = [];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->installEntitySchema('user');
    $this->installEntitySchema('node');
    $this->installEntitySchema('taxonomy_term');
    $this->installSchema('node', ['node_access']);
    $this->installConfig(['system', 'user', 'node', 'field', 'filter', 'taxonomy', 'views']);
    $this->config('jsonapi.settings')->set('read_only', FALSE)->save();
    // The serializer formats dates in the site timezone, unset in a kernel test.
    $this->config('system.date')->set('timezone.default', 'Australia/Sydney')->save();

    NodeType::create(['type' => 'article', 'name' => 'Article'])->save();

    // drupal/config/sync, relative to this module's own location.
    $sync = dirname(__DIR__, 7) . '/config/sync';
    $entity_type_manager = $this->container->get('entity_type.manager');
    foreach (static::CONFIG as $key => $name) {
      $entity_type = explode(':', $key)[0];
      $data = Yaml::decode((string) file_get_contents("$sync/$name.yml"));
      $entity_type_manager->getStorage($entity_type)->createFromStorageRecord($data)->save();
    }
    $this->container->get('router.builder')->rebuild();

    foreach (['Drupal', 'Druxt', 'Planet Drupal'] as $name) {
      $this->terms[$name] = Term::create(['vid' => 'article_category', 'name' => $name]);
      $this->terms[$name]->save();
    }
    foreach (['Caching', 'JSON:API', 'Nuxt'] as $name) {
      $this->terms[$name] = Term::create(['vid' => 'article_topic', 'name' => $name]);
      $this->terms[$name]->save();
    }

    // The real site's anonymous role reads content over JSON:API; the write
    // permissions stand in for push-story.mjs's OAuth story_sync role.
    Role::load(RoleInterface::ANONYMOUS_ID)
      ->grantPermission('access content')
      ->grantPermission('bypass node access')
      ->grantPermission('administer nodes')
      ->save();
  }

  /**
   * Creates an article.
   *
   * @param string $title
   *   The title.
   * @param string[] $terms
   *   Category and topic term names; each goes to its vocabulary's field.
   * @param string $published
   *   The field_published date, as a strtotime() expression.
   * @param bool $status
   *   Whether the node is published.
   *
   * @return \Drupal\node\NodeInterface
   *   The saved article.
   */
  protected function article(string $title, array $terms, string $published, bool $status = TRUE): NodeInterface {
    $ids = fn(string $vid) => array_values(array_map(
      fn(string $name) => $this->terms[$name]->id(),
      array_filter($terms, fn(string $name) => $this->terms[$name]->bundle() === $vid),
    ));
    $node = Node::create([
      'type' => 'article',
      'title' => $title,
      'status' => $status,
      'field_article_category' => $ids('article_category'),
      'field_topics' => $ids('article_topic'),
      'field_published' => gmdate('Y-m-d\TH:i:s', strtotime($published)),
    ]);
    $node->save();
    return $node;
  }

  /**
   * Joins entity IDs into a views break_phrase argument.
   *
   * @param \Drupal\Core\Entity\EntityInterface[] $entities
   *   The entities.
   *
   * @return string
   *   Their IDs, joined with "+".
   */
  protected function ids(array $entities): string {
    return implode('+', array_map(fn($entity) => $entity->id(), $entities));
  }

  /**
   * Runs the view's JSON:API display and returns the result titles.
   *
   * @param string $exclude
   *   The first argument: node IDs to leave out.
   * @param string $terms
   *   The second argument: topic and category term IDs to match.
   *
   * @return string[]
   *   Node titles, in result order.
   */
  protected function runView(string $exclude, string $terms): array {
    $view = Views::getView('related_articles');
    $view->setDisplay('jsonapi');
    $view->preview('jsonapi', [$exclude, $terms]);
    return array_map(fn($row) => $row->_entity->label(), $view->result);
  }

  /**
   * Sends a JSON:API request through the kernel.
   *
   * @param string $method
   *   The HTTP method.
   * @param string $uri
   *   The path and query.
   * @param array|null $body
   *   A JSON:API document to send.
   *
   * @return array
   *   The decoded response document, with the status code under 'status'.
   */
  protected function request(string $method, string $uri, ?array $body = NULL): array {
    $request = Request::create($uri, $method, [], [], [], [
      'CONTENT_TYPE' => 'application/vnd.api+json',
      'HTTP_ACCEPT' => 'application/vnd.api+json',
    ], $body === NULL ? NULL : Json::encode($body));
    $response = $this->container->get('http_kernel')->handle($request);
    return ['status' => $response->getStatusCode()] + (Json::decode((string) $response->getContent()) ?? []);
  }

  /**
   * Tests the field definitions the sync and push-story depend on.
   */
  public function testFieldDefinitions(): void {
    $field_manager = $this->container->get('entity_field.manager');

    $related = $field_manager->getFieldDefinitions('node', 'article')['field_related'];
    $this->assertSame('entity_reference', $related->getType());
    $this->assertSame('node', $related->getSetting('target_type'));
    $this->assertSame(['article' => 'article'], $related->getSetting('handler_settings')['target_bundles']);
    $this->assertSame(-1, $related->getFieldStorageDefinition()->getCardinality());

    $topics = $field_manager->getFieldDefinitions('node', 'article')['field_topics'];
    $this->assertSame('taxonomy_term', $topics->getSetting('target_type'));
    $this->assertSame(['article_topic' => 'article_topic'], $topics->getSetting('handler_settings')['target_bundles']);
    $this->assertTrue($topics->getSetting('handler_settings')['auto_create']);
    $this->assertSame(-1, $topics->getFieldStorageDefinition()->getCardinality());

    $public = $field_manager->getFieldDefinitions('taxonomy_term', 'article_category')['field_public'];
    $this->assertSame('boolean', $public->getType());
  }

  /**
   * Tests that a new category term is public unless set otherwise.
   */
  public function testCategoryTermsDefaultToPublic(): void {
    $this->assertSame('1', (string) $this->terms['Drupal']->get('field_public')->value);

    $hidden = Term::create(['vid' => 'article_category', 'name' => 'JSON:API', 'field_public' => 0]);
    $hidden->save();
    $this->assertSame('0', (string) Term::load($hidden->id())->get('field_public')->value);
  }

  /**
   * Tests that field_public is exposed to the sync over JSON:API.
   */
  public function testFieldPublicOverJsonApi(): void {
    $this->terms['Planet Drupal']->set('field_public', 0)->save();
    $document = $this->request('GET', '/jsonapi/taxonomy_term/article_category/' . $this->terms['Planet Drupal']->uuid());
    $this->assertSame(200, $document['status']);
    $this->assertFalse($document['data']['attributes']['field_public']);
  }

  /**
   * Tests the ranking: shared topics, then shared categories, then date.
   */
  public function testViewRanksByTopicsThenCategoriesThenDate(): void {
    $self = $this->article('Self', ['Drupal', 'Druxt', 'Planet Drupal', 'Caching', 'JSON:API'], '-1 day');
    $two_topics = $this->article('Two topics, no category', ['Caching', 'JSON:API'], '-300 days');
    $one_two = $this->article('One topic, two categories', ['Caching', 'Drupal', 'Druxt'], '-200 days');
    $one_one_new = $this->article('One topic, one category, newer', ['JSON:API', 'Drupal'], '-10 days');
    $this->article('One topic, one category, older', ['Caching', 'Druxt'], '-100 days');
    // Unshared topics never count: one shared topic, as many others as it likes.
    $this->article('One shared topic among others', ['Nuxt', 'Caching'], '-3 days');
    $this->article('Two categories only', ['Drupal', 'Druxt'], '-2 days');
    $this->article('Shares only Planet Drupal and an unpassed topic', ['Planet Drupal', 'Nuxt'], '-4 days');
    $this->article('Unpublished', ['Drupal', 'Druxt', 'Caching', 'JSON:API'], '-5 days', FALSE);
    $this->article('Future', ['Drupal', 'Druxt', 'Caching', 'JSON:API'], '+5 days');
    $picked = $this->article('Picked', ['Drupal', 'Druxt', 'Caching', 'JSON:API'], '-6 days');

    // Planet Drupal is a syndication flag, so the sync never passes it.
    $terms = $this->ids(array_map(fn($name) => $this->terms[$name], ['Caching', 'JSON:API', 'Drupal', 'Druxt']));
    $this->assertSame(
      ['Two topics, no category', 'One topic, two categories', 'One topic, one category, newer'],
      $this->runView($this->ids([$self, $picked]), $terms),
    );

    // The pager stops at three; excluding the leaders lets the rest through.
    $this->assertSame(
      ['One topic, one category, older', 'One shared topic among others', 'Two categories only'],
      $this->runView($this->ids([$self, $picked, $two_topics, $one_two, $one_one_new]), $terms),
    );
  }

  /**
   * Tests that without topics to match, categories alone rank.
   */
  public function testViewRanksByCategoriesWithoutTopics(): void {
    $self = $this->article('Self', ['Drupal', 'Druxt'], '-1 day');
    $this->article('One category, newer', ['Drupal', 'Nuxt'], '-2 days');
    $this->article('Two categories, older', ['Drupal', 'Druxt'], '-50 days');
    $this->assertSame(
      ['Two categories, older', 'One category, newer'],
      $this->runView($self->id(), $this->ids([$this->terms['Drupal'], $this->terms['Druxt']])),
    );
  }

  /**
   * Tests that posts sharing only a term not passed never rank.
   */
  public function testViewIgnoresTermsNotPassed(): void {
    $self = $this->article('Self', ['Drupal', 'Planet Drupal'], '-1 day');
    $this->article('Shares only Planet Drupal', ['Planet Drupal'], '-2 days');
    $this->assertSame([], $this->runView($self->id(), $this->terms['Drupal']->id()));
  }

  /**
   * Tests that no term argument returns nothing, leaving the fallback.
   */
  public function testViewWithoutCategoriesIsEmpty(): void {
    $self = $this->article('Self', [], '-1 day');
    $this->article('Other', ['Drupal'], '-2 days');
    $this->assertSame([], $this->runView($self->id(), ''));
  }

  /**
   * Tests the view over JSON:API Views, the way sync-content.mjs reads it.
   */
  public function testViewOverJsonApiViews(): void {
    $self = $this->article('Self', ['Drupal', 'Druxt', 'Caching'], '-1 day');
    $two = $this->article('Shares a topic', ['Caching'], '-50 days');
    $one = $this->article('Shares a category', ['Drupal'], '-2 days');

    $query = http_build_query(['views-argument' => [$self->id(), $this->ids([$this->terms['Caching'], $this->terms['Drupal'], $this->terms['Druxt']])]]);
    $document = $this->request('GET', "/jsonapi/views/related_articles/jsonapi?$query");

    $this->assertSame(200, $document['status']);
    $this->assertSame([$two->uuid(), $one->uuid()], array_column($document['data'], 'id'));
    $this->assertSame('node--article', $document['data'][0]['type']);
  }

  /**
   * Tests that field_related round-trips over JSON:API in order.
   */
  public function testFieldRelatedOverJsonApi(): void {
    $self = $this->article('Self', ['Drupal'], '-1 day');
    $first = $this->article('First pick', ['Drupal'], '-2 days');
    $second = $this->article('Second pick', ['Drupal'], '-3 days');

    // Written the way push-story.mjs writes it: second pick first.
    $document = $this->request('PATCH', '/jsonapi/node/article/' . $self->uuid(), [
      'data' => [
        'type' => 'node--article',
        'id' => $self->uuid(),
        'relationships' => [
          'field_related' => [
            'data' => [
              ['type' => 'node--article', 'id' => $second->uuid()],
              ['type' => 'node--article', 'id' => $first->uuid()],
            ],
          ],
        ],
      ],
    ]);
    $this->assertSame(200, $document['status'], Json::encode($document['errors'] ?? []));

    $stored = Node::load($self->id());
    $this->assertSame(
      [$second->id(), $first->id()],
      array_column($stored->get('field_related')->getValue(), 'target_id'),
    );

    $document = $this->request('GET', '/jsonapi/node/article/' . $self->uuid());
    $this->assertSame(
      [$second->uuid(), $first->uuid()],
      array_column($document['data']['relationships']['field_related']['data'], 'id'),
    );
  }

}
