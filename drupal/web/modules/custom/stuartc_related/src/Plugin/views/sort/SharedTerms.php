<?php

namespace Drupal\stuartc_related\Plugin\views\sort;

use Drupal\Component\Plugin\PluginManagerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\views\Attribute\ViewsSort;
use Drupal\views\Plugin\views\sort\SortPluginBase;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Sorts by the number of terms in one vocabulary shared with an argument.
 *
 * The view's taxonomy term ID argument holds the term IDs to match, from
 * several vocabularies at once. This sort keeps those in its own vocabulary,
 * joins taxonomy_index on them (the IDs go in the join, so nodes sharing
 * none still join, as NULL), and orders by COUNT(DISTINCT tid). Two of these,
 * one per vocabulary, rank by shared topics first, then shared categories,
 * which separate contextual filters cannot: their conditions would be ANDed.
 * The view must use aggregation.
 */
#[ViewsSort("stuartc_shared_terms")]
final class SharedTerms extends SortPluginBase implements ContainerFactoryPluginInterface {

  /**
   * Constructs a SharedTerms sort.
   *
   * @param array $configuration
   *   The plugin configuration.
   * @param string $plugin_id
   *   The plugin ID.
   * @param mixed $plugin_definition
   *   The plugin definition.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager, to read each argument term's vocabulary.
   * @param \Drupal\Component\Plugin\PluginManagerInterface $joinManager
   *   The Views join plugin manager.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, protected EntityTypeManagerInterface $entityTypeManager, protected PluginManagerInterface $joinManager) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static($configuration, $plugin_id, $plugin_definition, $container->get('entity_type.manager'), $container->get('plugin.manager.views.join'));
  }

  /**
   * {@inheritdoc}
   */
  protected function defineOptions() {
    $options = parent::defineOptions();
    $options['vocabulary'] = ['default' => ''];
    $options['argument'] = ['default' => 'tid'];
    return $options;
  }

  /**
   * {@inheritdoc}
   */
  public function buildOptionsForm(&$form, FormStateInterface $form_state) {
    parent::buildOptionsForm($form, $form_state);
    $form['vocabulary'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Vocabulary'),
      '#description' => $this->t('Machine name of the vocabulary whose shared terms are counted.'),
      '#default_value' => $this->options['vocabulary'],
      '#required' => TRUE,
    ];
    $form['argument'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Taxonomy term ID argument'),
      '#description' => $this->t('ID of the contextual filter holding the term IDs to match.'),
      '#default_value' => $this->options['argument'],
      '#required' => TRUE,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function adminSummary() {
    return $this->t('@vocabulary, @order', [
      '@vocabulary' => $this->options['vocabulary'],
      '@order' => $this->options['order'],
    ]);
  }

  /**
   * Returns the argument's term IDs that belong to this sort's vocabulary.
   *
   * @return int[]
   *   Term IDs.
   */
  public function sharedTermIds(): array {
    $argument = $this->view->argument[$this->options['argument']] ?? NULL;
    $values = array_filter(array_map('intval', (array) ($argument->value ?? [])));
    if (!$values) {
      return [];
    }
    $terms = $this->entityTypeManager->getStorage('taxonomy_term')->loadMultiple($values);
    $ids = [];
    foreach ($terms as $term) {
      if ($term->bundle() === $this->options['vocabulary']) {
        $ids[] = (int) $term->id();
      }
    }
    return $ids;
  }

  /**
   * {@inheritdoc}
   */
  public function query() {
    $tids = $this->sharedTermIds();
    // Nothing in this vocabulary to match: every node ties at zero.
    if (!$tids) {
      return;
    }
    $this->ensureMyTable();
    $join = $this->joinManager->createInstance('standard', [
      'type' => 'LEFT',
      'table' => 'taxonomy_index',
      'field' => 'nid',
      'left_table' => $this->tableAlias,
      'left_field' => 'nid',
      'extra' => [
        // The join collapses a one-item array to a scalar but keeps the
        // operator, so a single term needs '=' rather than 'IN'.
        ['field' => 'tid', 'value' => $tids, 'operator' => count($tids) > 1 ? 'IN' : '='],
      ],
    ]);
    $alias = $this->query->addTable('taxonomy_index', $this->relationship, $join, 'shared_' . $this->options['id']);
    $this->query->addOrderBy($alias, 'tid', $this->options['order'], 'shared_' . $this->options['id'] . '_count', ['function' => 'count_distinct']);
  }

}
