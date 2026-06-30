---
date: '2022-04-12'
title: 'Decoupling configuration with Config Pages'
description: 'Using the Config Pages module to decouple site configuration from Drupal content in a Druxt-powered front end.'
read: '7 min'
tags:
  - Druxt
---

## The problem

When you decouple Drupal, configuration that used to live in site settings
becomes harder to expose to the front end. Traditional approaches — variables,
blocks, or custom endpoints — each have trade-offs.

## Config Pages to the rescue

The [Config Pages](https://www.drupal.org/project/config_pages) module lets you
define structured configuration entities with fields, just like content types.
The difference: they're singletons, not nodes, and they export as config.

```php
// config_pages is config-entity based, so it deploys cleanly.
```

## Exposing to Druxt

With DruxtJS, Config Pages can be exposed via JSON:API and consumed in the Nuxt
front end as a single-source-of-truth for site-wide settings.

This keeps content editors in Drupal and developers in Nuxt — exactly the
separation a decoupled architecture should provide.
