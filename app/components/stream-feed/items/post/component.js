import Component from 'ember-component';
import service from 'ember-service/inject';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import { hrefTo } from 'ember-href-to/helpers/href-to';
import getter from 'client/utils/getter';
import ClipboardMixin from 'client/mixins/clipboard';
import jQuery from 'jquery';

export default Component.extend(ClipboardMixin, {
  classNameBindings: ['post.isNew:new-post'],
  classNames: ['stream-item', 'row'],
  session: service(),
  store: service(),
  metrics: service(),
  host: getter(() => `${location.protocol}//${location.host}`),

  activity: getter(function() {
    return get(this, 'group.activities.firstObject');
  }),

  tweetLink: getter(function() {
    const host = get(this, 'host');
    const link = hrefTo(this, 'posts', get(this, 'post.id'));
    const url = `${host}${link}`;
    // TODO: i18n
    const text = encodeURIComponent('Check out this post on #kitsu');
    return `https://twitter.com/share?text=${text}&url=${url}`;
  }),

  facebookLink: getter(function() {
    const host = get(this, 'host');
    const link = hrefTo(this, 'posts', get(this, 'post.id'));
    const url = `${host}${link}`;
    return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  }),

  _streamAnalytics(label, verb, object) {
    if (jQuery.isPlainObject(verb) === true) {
      object = verb; // eslint-disable-line no-param-reassign
      verb = undefined; // eslint-disable-line no-param-reassign
    }
    // foreign_id is manually build as it may be a post on a `posts` page.
    const data = {
      label,
      content: {
        foreign_id: `Post:${get(this, 'post.id')}`,
        actor: {
          id: `User:${get(this, 'session.account.id')}`,
          label: get(this, 'session.account.name')
        },
        verb: verb || label
      },
      position: get(this, 'positionInFeed') || 0
    };
    if (object !== undefined) {
      data.content.object = object;
    }
    if (get(this, 'feedId') !== undefined) {
      data.feed_id = get(this, 'feedId');
    }
    get(this, 'metrics').invoke('trackEngagement', 'Stream', data);
  },

  didReceiveAttrs() {
    this._super(...arguments);
    if (get(this, 'group') !== undefined) {
      set(this, 'post', get(this, 'activity.subject'));
    }
  },

  actions: {
    trackClick(verb) {
      this._streamAnalytics('click', verb, { id: `Post:${get(this, 'post.id')}` });
    },

    createdComment() {
      get(this, 'post').incrementProperty('commentsCount');
    },

    savedComment(record, error) {
      if (error !== undefined) {
        get(this, 'post').decrementProperty('commentsCount');
      } else {
        this._streamAnalytics('comment', { id: `Comment:${get(record, 'id')}` });
      }
    },

    createdPostLike() {
      get(this, 'post').incrementProperty('postLikesCount');
    },

    savedPostLike(record, error) {
      if (error !== undefined) {
        get(this, 'post').decrementProperty('postLikesCount');
      } else {
        this._streamAnalytics('like', { id: `PostLike:${get(record, 'id')}` });
      }
    },

    destroyedPostLike(record, error) {
      if (error !== undefined) {
        record.rollbackAttributes();
      } else {
        get(this, 'post').decrementProperty('postLikesCount');
      }
    }
  }
});
