# Foundry

Foundry is a config only, profile based, Drupal distribution designed to be a good starting point for most websites. It is primarily focused on great Drupal admin experience, properly constrained content creation flexibility, great tools for data modelling, and to use with a decoupled front-end.

## You are in control

Foundry's architecture is such that after the initial installation it does not get in the way of future development.

## Config only

Foundry is designed to set configuration during Site installation and then get out of your way. Future Foundry updates will only be applied to new installations so you can safely update Foundry without any risk of breaking your own customisation.

## No Composer dependencies in Profile

We put all of the dependencies in the Composer Project that you use to install Foundry, all of the dependencies get added to your primary project composer.json and there are none in the profile. If you've ever been blocked trying to update a module in your project composer.json because of a dependencies composer file pinning it to a particular version you will love Foundry!
