<?php

namespace Drupal\stuartc_related;

use Drupal\Core\DependencyInjection\ContainerBuilder;
use Drupal\Core\DependencyInjection\ServiceProviderBase;
use Drupal\stuartc_related\EventSubscriber\TomeRelatedSubscriber;
use Drupal\stuartc_related\Normalizer\DeferredReferenceItemNormalizer;
use Symfony\Component\DependencyInjection\Argument\ServiceClosureArgument;
use Symfony\Component\DependencyInjection\Reference;

/**
 * Registers the Tome integration only when Tome Sync is installed.
 *
 * Both services build on Tome Sync classes, so registering them without it
 * would break the container.
 */
class StuartcRelatedServiceProvider extends ServiceProviderBase {

  /**
   * {@inheritdoc}
   */
  public function register(ContainerBuilder $container) {
    $modules = $container->getParameter('container.modules');
    if (!isset($modules['tome_sync'])) {
      return;
    }

    // Above Tome Sync's entity reference normalizers (the highest is 21), so
    // it is asked first; it claims only field_related items during an import.
    // The importer depends on the serializer, so it is passed as a closure.
    $container->register('stuartc_related.normalizer.deferred_reference', DeferredReferenceItemNormalizer::class)
      ->addArgument(new Reference('entity.repository'))
      ->addArgument(new ServiceClosureArgument(new Reference('tome_sync.importer')))
      ->addTag('normalizer', ['priority' => 22]);

    $container->register('stuartc_related.tome_subscriber', TomeRelatedSubscriber::class)
      ->addArgument(new Reference('entity_type.manager'))
      ->addArgument(new Reference('tome_sync.importer'))
      ->addArgument(new Reference('tome_sync.storage.content'))
      ->addArgument(new Reference('file_system'))
      ->addArgument(new Reference('entity.repository'))
      ->addTag('event_subscriber');
  }

}
