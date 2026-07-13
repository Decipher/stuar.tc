---
date: '2022-03-01'
title: 'Layout Paragraphs module'
description: 'How the Layout Paragraphs module brings structured, drag-and-drop layout building to Drupal paragraphs.'
read: '6 min'
tags:
  - Druxt
---

## Why Layout Paragraphs?

Drupal's Paragraphs module is powerful but leaves layout decisions to theme
CSS. [Layout Paragraphs](https://www.drupal.org/project/layout_paragraphs)
adds a visual layout builder on top, giving editors drag-and-drop control
over section placement.

## How it works

Each paragraph can be placed into a layout region (sidebar, main content,
full-width banner) using Drupal's Layout Plugin system. The editor gets a
visual preview; the developer gets clean, structured data.

## Decoupled-friendly

Because layouts are stored as structured data (not rendered HTML), they
work beautifully in a decoupled setup. DruxtJS can consume the layout
definition and render it with Nuxt components.
