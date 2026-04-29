'use strict';

/**
 * pet-owner controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::pet-owner.pet-owner');
