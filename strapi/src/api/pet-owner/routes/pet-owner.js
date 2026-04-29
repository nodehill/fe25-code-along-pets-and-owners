'use strict';

/**
 * pet-owner router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::pet-owner.pet-owner');
