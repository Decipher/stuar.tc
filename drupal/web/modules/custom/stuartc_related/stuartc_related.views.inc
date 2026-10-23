<?php

/**
 * @file
 * Views integration for stuar.tc related articles.
 */

/**
 * Implements hook_views_data_alter().
 */
function stuartc_related_views_data_alter(array &$data): void {
  $data['node_field_data']['stuartc_shared_terms'] = [
    'title' => t('Shared terms'),
    'help' => t('Sorts by how many terms in one vocabulary a node shares with a taxonomy term ID argument.'),
    'real field' => 'nid',
    'sort' => [
      'id' => 'stuartc_shared_terms',
    ],
  ];
}
