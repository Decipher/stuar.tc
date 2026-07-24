SHELL=/bin/bash

# Load variables from .env if present and export them to recipe shells. The
# leading '-' on -include suppresses errors when the file does not exist.
-include .env
export

WEBSERVER_HOST ?= 127.0.0.1
WEBSERVER_PORT ?= 8888

# Prefer a Cloudflare tunnel URL (written to .env by a start-*.sh hook) so
# drush/login links work from outside a container.
DRUSH_URI := $(if $(TUNNEL_URL),$(TUNNEL_URL),http://$(WEBSERVER_HOST):$(WEBSERVER_PORT))

define title
	@echo -e "\n\033[36m$(1)\033[0m"
endef

.PHONY: assemble build debug debug-off debug-on delete describe destroy drush help info lint lint-fix login provision reset start stop test
.PHONY: test-unit test-kernel test-functional

help:
	@echo "COMMANDS"
	@echo "========"
	@echo "build           - Assemble, provision, and start (full local setup)."
	@echo "assemble        - Install Composer dependencies."
	@echo "provision       - Install the site (SQLite + Tome import of committed config/content)."
	@echo "start           - Start the PHP built-in development server."
	@echo "stop            - Stop the development server."
	@echo "info            - Print a read-only summary of the current environment (alias: describe)."
	@echo "drush           - Run a Drush command."
	@echo "login           - Run Drush uli (one-time login link)."
	@echo "debug           - Enable PHP XDebug step-debugging for the development server."
	@echo "lint            - Check coding standards (PHPCS + PHPStan)."
	@echo "lint-fix        - Fix PHPCS violations."
	@echo "test                       - Run all tests."
	@echo "test-unit                  - Run unit tests."
	@echo "test-kernel                - Run kernel tests."
	@echo "test-functional            - Run functional tests."
	@echo "reset           - Stop the server and wipe the throwaway database (aliases: delete, destroy)."

build: stop assemble provision start

assemble:
	./.devtools/assemble

provision:
	./.devtools/provision

start:
	./.devtools/start

stop:
	./.devtools/stop

info:
	@./.devtools/info

# DDEV uses `describe` for the equivalent of our `info`. Kept as an alias for
# muscle memory coming from DDEV.
describe: info

# Enable PHP XDebug step-debugging by restarting the PHP server with
# `-d xdebug.mode=debug -d xdebug.start_with_request=yes`. Run `make start`
# to disable.
debug:
	@[ "$$(./.devtools/info xdebug)" = "enabled" ] && echo "XDebug is already enabled. Run 'make start' to disable." || \
		(XDEBUG=1 ./.devtools/start && sleep 1 && [ "$$(./.devtools/info xdebug)" = "enabled" ] && echo "Enabled XDebug. Run 'make start' to disable." || (echo "Failed to enable XDebug." && exit 1))

debug-on xdebug xdebug-on: debug
debug-off xdebug-off: start

# Allow running Drush commands with `make drush <command>`.
ifeq (drush,$(firstword $(MAKECMDGOALS)))
  DRUSH_RUN_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
  $(eval $(DRUSH_RUN_ARGS):;@:)
endif

drush:
	vendor/bin/drush -l $(DRUSH_URI) $(DRUSH_RUN_ARGS)

login:
	vendor/bin/drush -l $(DRUSH_URI) uli

lint:
	$(call title,Running PHPCS)
	vendor/bin/phpcs
	$(call title,Running PHPStan)
	vendor/bin/phpstan

lint-fix:
	$(call title,Running PHPCBF)
	vendor/bin/phpcbf

test:
	$(call title,Running PHPUnit)
	BROWSERTEST_OUTPUT_DIRECTORY=/tmp vendor/bin/phpunit

test-unit:
	vendor/bin/phpunit --testsuite unit

test-kernel:
	vendor/bin/phpunit --testsuite kernel

test-functional:
	BROWSERTEST_OUTPUT_DIRECTORY=/tmp vendor/bin/phpunit --testsuite functional

# DDEV uses `delete` and Lando uses `destroy` for what our `reset` does.
delete destroy: reset

reset: stop
	rm -f /tmp/stuartclark-*.sqlite /tmp/stuartclark-php-server.log > /dev/null 2>&1 || true

.DEFAULT_GOAL := build
