module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/pets/species',
      handler: 'pet.findUniqueSpecies', // must be defined as a method in the controller
      config: {
        auth: false,
        policies: [],
        middleware: []
      }
    }
  ]
};