'use strict';

/**
 * Security fix for PUT /api/users/:id
 * --------------------------------------------------------------
 * Strapi's users-permissions plugin ships with a route
 *   PUT /api/users/:id
 * which we use from the frontend (the /profile page) to let a
 * logged-in user update their own details.
 *
 * The default implementation in Strapi does TWO things we don't
 * want:
 *
 *   1) It does not check that the :id in the URL is the same as
 *      the id of the logged-in user. This means that anyone with
 *      a valid JWT can update ANY OTHER USER simply by writing a
 *      different id in the URL. For example, user no. 5 could
 *      send PUT /api/users/1 and overwrite the admin user's data.
 *
 *   2) It allows the request body to contain any field — for
 *      example { role: 1 } (privilege escalation: make me an
 *      admin), { confirmed: true } (bypass email verification)
 *      or { blocked: false } (unblock a blocked account).
 *      This is true even when updating yourself — users should
 *      not be able to change their own role or admin flags.
 *
 * This file "extends" the plugin and adds two layers of
 * protection around the update controller:
 *
 *   A) Ownership check: :id must match the logged-in user's id.
 *   B) Field whitelist: only username, email and password can be
 *      updated through this endpoint. Anything else is stripped
 *      from the body before the default controller runs.
 */

// Fields a user is allowed to change about themselves via /profile.
// NOTE: 'role', 'confirmed', 'blocked', 'provider' etc. must NOT
// be listed here — they control permissions and account status
// and are managed by admins (or automatically by Strapi).
const ALLOWED_FIELDS = ['username', 'email', 'password'];

module.exports = (plugin) => {

  // Keep a reference to the original update controller so we can
  // delegate to it after our security checks have passed.
  const originalUpdate = plugin.controllers.user.update;

  plugin.controllers.user.update = async (ctx) => {

    // --- A) Ownership check ------------------------------------------
    // ctx.state.user is set by Strapi when a valid JWT is sent in.
    // If no user is logged in at all, Strapi should already have
    // rejected the request, but we guard against it anyway.
    const loggedInUserId = ctx.state.user?.id;
    if (!loggedInUserId) {
      return ctx.unauthorized('You must be logged in');
    }

    // Compare as strings — :id from the URL is always a string,
    // while ctx.state.user.id is a number. Without String() the
    // comparison would always be false and NO ONE could update
    // themselves.
    if (String(ctx.params.id) !== String(loggedInUserId)) {
      return ctx.forbidden('You can only update your own profile');
    }

    // --- B) Field whitelist ------------------------------------------
    // Rebuild the body so it ONLY contains the fields we allow.
    // Everything else (role, confirmed, blocked, ...) is removed
    // before the default controller ever sees it.
    const cleanBody = {};
    for (const field of ALLOWED_FIELDS) {
      if (ctx.request.body?.[field] !== undefined) {
        cleanBody[field] = ctx.request.body[field];
      }
    }
    ctx.request.body = cleanBody;

    // All good — run the original update controller (which hashes
    // the password, validates the email format, etc.).
    return originalUpdate(ctx);
  };

  return plugin;
};
