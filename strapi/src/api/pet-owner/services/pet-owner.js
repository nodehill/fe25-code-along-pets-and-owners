'use strict';

/**
 * pet-owner service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::pet-owner.pet-owner');
