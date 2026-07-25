<?php

namespace Drupal\Tests\stuartc_tests\Functional;

use Drupal\menu_link_content\Entity\MenuLinkContent;

/**
 * Tests the `menu_items--main` JSON:API endpoint provided by Stuart's own
 * jsonapi_menu_items module.
 *
 * @group jsonapi
 * @group stuartc_tests
 */
class JsonApiMenuItemsTest extends JsonApiFunctionalTestBase {

  /**
   * Tests that menu_items--main returns 200 with title/url.
   */
  public function testMainMenuItemsEndpoint() {
    // The menu tree's checkAccess manipulator filters out links the
    // requesting (anonymous) user can't view — a route requiring
    // authentication (e.g. user.page) or an unresolvable path is silently
    // dropped from the response, or trips deprecations deep in core's
    // route/access-check code for a nonexistent context entity. Link to a
    // real, publicly-viewable node instead, matching how a real site's
    // main menu links actually resolve.
    $this->createArticleContentType();
    $node = $this->createArticleNode();

    MenuLinkContent::create([
      'title' => 'Writing',
      'link' => ['uri' => 'entity:node/' . $node->id()],
      'menu_name' => 'main',
    ])->save();

    $result = $this->getJsonApi('/jsonapi/menu_items/main');
    $this->assertEquals(200, $result['status']);
    $this->assertNotEmpty($result['body']['data']);
    // MenuItemsResource::getMenuItems() wraps each real menu link entity
    // under its own entity--bundle resource type (see
    // jsonapi_menu_items/src/Resource/MenuItemsResource.php) — "menu_items"
    // names the collection endpoint/route, not a synthetic resource type.
    $this->assertEquals('menu_link_content--menu_link_content', $result['body']['data'][0]['type']);
    $this->assertArrayHasKey('title', $result['body']['data'][0]['attributes']);
    $this->assertArrayHasKey('url', $result['body']['data'][0]['attributes']);
  }

}
