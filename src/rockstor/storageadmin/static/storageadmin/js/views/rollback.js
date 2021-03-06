/*
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this page.
 *
 * Copyright (c) 2012-2013 RockStor, Inc. <http://rockstor.com>
 * This file is part of RockStor.
 *
 * RockStor is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published
 * by the Free Software Foundation; either version 2 of the License,
 * or (at your option) any later version.
 *
 * RockStor is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */

RollbackView = RockstorLayoutView.extend({
  events: {
    'click #js-cancel': 'cancel',
    'click #js-confirm-rollback-submit': 'confirmRollback'
  },

  initialize: function() {
    this.constructor.__super__.initialize.apply(this, arguments);
    // Templates
    this.template = window.JST.share_rollback;
    this.snapshot_list_template = window.JST.share_rollback_snapshot_list;
    this.pagination_template = window.JST.common_pagination;
    // Dependencies
    this.share = new Share({shareName: this.options.shareName});
    this.collection = new SnapshotCollection();
    this.collection.pageSize = 10;
    this.collection.setUrl(this.options.shareName);
    this.dependencies.push(this.share);
    this.dependencies.push(this.collection);
    this.collection.on('reset', this.renderSnapshotList, this);
  },

  render: function() {
    this.fetch(this.renderRollback, this);
    return this;
  },

  renderRollback: function() {
    var _this = this;
    $(this.el).html(this.template({
      collection: this.collection,
      share: this.share
    }));
    this.renderSnapshotList();
    this.$('#rollback-form').validate({
      onfocusout: false,
      onkeyup: false,
      rules: {
        snapshot: "required",
      },
      submitHandler: function() {
        var button = _this.$('#rollback-share');
        var snapName = _this.$('input:radio[name=snapshot]:checked').val();
        // set snap name in confirm dialog
        _this.$('#confirm-snap-name').html(snapName);
        // show confirm dialog
        _this.$('#confirm-rollback').modal();
        return false;
      }
    });

  },

  renderSnapshotList: function() {
    this.$('#ph-snapshot-list').html(this.snapshot_list_template({
      snapshots: this.collection
    }));
    this.$(".pagination-ph").html(this.pagination_template({
      collection: this.collection
    }));
  },

  confirmRollback: function(event) {
    var _this = this;
    var button = $(event.currentTarget);
    if (buttonDisabled(button)) return false;
    disableButton(button);
    var snapName = this.$('input:radio[name=snapshot]:checked').val();
    $.ajax({
      url: '/api/shares/' + _this.share.get('name') + '/rollback',
      type: "POST",
      dataType: "json",
      contentType: 'application/json',
      data: JSON.stringify({name: snapName}),
      success: function() {
        enableButton(button);
        _this.$('#confirm-rollback').modal('hide');
        $('.modal-backdrop').remove();
        app_router.navigate('shares/' + _this.share.get('name'), {trigger: true})

      },
      error: function(xhr, status, error) {
        enableButton(button);
      },
    });

  },

  cancel: function(event) {
    if (event) event.preventDefault();
    app_router.navigate('shares/' + this.share.get('name'), {trigger: true})
  }

});

// Add pagination
Cocktail.mixin(RollbackView, PaginationMixin);
