'use strict';

/**
 * pet controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::pet.pet', ({ strapi }) => ({

  // return an object with functions custom routes (right now just one function)

  async findUniqueSpecies(ctx) {
    const pets = await strapi.documents('api::pet.pet').findMany({
      fields: ['species']
    });

    // using set to remove duplicates and then we spread the set to an array
    const species = [...new Set(pets
      .map(pet => pet.species))]  // from objects {species: 'xxx'} to strings
      .filter(species => species) // if species is undefined/empty string don't keep
      .sort();                    // sort alphabetically

    // ctx.body = what you want return from your route
    ctx.body = { data: species };
  }

}));
