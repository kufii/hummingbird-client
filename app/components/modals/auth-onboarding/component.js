import Component from 'ember-component';
import set from 'ember-metal/set';
import get from 'ember-metal/get';
import computed from 'ember-computed';
import { invokeAction } from 'ember-invoke-action';
import { scheduleOnce } from 'ember-runloop';

/**
 * This component should be invoked within a wormhole.
 */
export default Component.extend({
  component: 'social-auth',
  componentName: computed('component', {
    get() {
      return `modals/auth-onboarding/${get(this, 'component')}`;
    }
  }),

  didInsertElement() {
    this._super(...arguments);
    scheduleOnce('afterRender', () => this.$('.modal').modal('show'));
  },

  actions: {
    onClose() {
      invokeAction(this, 'onClose');
    },

    changeComponent(component) {
      set(this, 'component', component);
      this.$('.modal').data('bs.modal')._handleUpdate();
    },

    closeModal() {
      this.$('.modal').modal('hide');
    }
  }
});
