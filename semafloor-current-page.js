var _alphaFloors = [
  'level 1','level 2','level 3','level 3A','level 5','level 6',
  'level 7','level 8','level 9','level 10','level 11','level 12'];
var _alphaFloorsCode = [
  '01level','02level','03level','04level','05level','06level',
  '07level','08level','09level','10level','11level','12level'];
var _siteNames = ['KLB - Tower 5','KLB - Tower 2A','SUITE'];
var _statusCodes = ['_alphaStatus', '_betaStatus', '_gammaStatus'];

Polymer({

  is: 'semafloor-current-page',

  properties: {
    selectedSite: {
      type: String,
      value: 'KLB - Tower 5'
    },
    selectedFloor: {
      type: String,
      value: '13level'
    },
    selectedFloorName: {
      type: String,
      value: 'Level 13'
    },
    selectedRoomName: {
      type: String,
      value: 'El Psy Kongroo'
    },

    _selectedPage: {
      type: String,
      value: 'waiting'
    },
    _floorsAtSelectedSite: {
      type: Array,
      value: function() {
          return _alphaFloors;
      },
      computed: '_computeFloorsAtSelection(selectedSite, _currentReservations)'
    },
    _currentReservations: {
      type: Object,
      value: function() {
        return {};
      }
    },
    _url: {
      type: String,
      value: 'https://semafloor-webapp.firebaseio.com/json/current-reservations'
    },
    _alphaStatus: {
      type: Array,
      value: function() {
        return [];
      },
      computed: '_computeFloorStatus(_currentReservations.alpha)'
    },
    _betaStatus: {
      type: Array,
      value: function() {
        return [];
      },
      computed: '_computeFloorStatus(_currentReservations.beta, "beta")'
    },
    _gammaStatus: {
      type: Array,
      value: function() {
        return [];
      },
      computed: '_computeFloorStatus(_currentReservations.gamma, "gamma")'
    },
    _roomsAtSelectedFloor: {
      type: Array,
      value: function() {
        return [];
      },
      computed: '_computeRoomsAtSelection(selectedSite, selectedFloor, _currentReservations)'
    },
    _infoAtSelectedRoom: {
      type: Array,
      value: function() {
        return [];
      }
    },

  },

  observers: [
    '_whenSelectedSiteChanged(selectedSite)'
  ],

  // Element Lifecycle
  created: function() {
    // console.log('semafloor-current-created');
    // console.time('semafloor-current-ready');
    // console.time('semafloor-current-attached');
  },

  ready: function() {
    // `ready` is called after all elements have been configured, but
    // propagates bottom-up. This element's children are ready, but parents
    // are not.
    //
    // This is the point where you should make modifications to the DOM (when
    // necessary), or kick off any processes the element wants to perform.
    // console.timeEnd('semafloor-current-ready');
  },

  attached: function() {
    // `attached` fires once the element and its parents have been inserted
    // into a document.
    //
    // This is a good place to perform any work related to your element's
    // visual state or active behavior (measuring sizes, beginning animations,
    // loading resources, etc).

    // TODO: load external resources, eg. Firebase.
    this.fire('current-page-attached');
    // console.timeEnd('semafloor-current-attached');
  },

  detached: function() {
    // The analog to `attached`, `detached` fires when the element has been
    // removed from a document.
    //
    // Use this to clean up anything you did in `attached`.
  },

  _onFirebaseValue: function(ev) {
    // set _currentReservations when data is fetched.
    this.set('_currentReservations', ev.detail.val());
    // hide spinner and switch to room page.
    if (this.selectedFloor !== '13level' && this._selectedPage === 'waiting') {
      this.set('_selectedPage', 'room');
    }
    // update all lists to update the fetched data.
    this.$.floorsList.fire('iron-resize');
    this.$.roomsList.fire('iron-resize');
    // fire an event when data is fetched.
    this.fire('current-reservations-ready');
    console.log('on-firebase-value');
  },

  _computeFloorsAtSelection: function(_selectedSite) {
    return [_alphaFloors, ['Level 3'],
      ['Level 1']][_siteNames.indexOf(_selectedSite)];
  },
  _whenSelectedSiteChanged: function(_selectedSite) {
    // go back to floor page when select on another site at floor page.
    if (this._selectedPage !== 'floor') {
      this.set('_selectedPage', 'floor');
    }
  },
  _computeFloorStatus: function(_site, _notAlpha) {
    if (_.isUndefined(_site) || _.isEmpty(_site)) {
      return;
    }

    var _floorsToBeInspected = _alphaFloorsCode;
    if (_notAlpha) {
      _floorsToBeInspected = _notAlpha === 'beta' ? ['03level'] : ['01level'];
    }

    // check if some of the rooms are vacant.
    return _floorsToBeInspected.map(function(el) {
      return _site[el].some(function(el) {
        return el.status === 'Vacant';
      });
    });
  },
  _isVacantFloor: function(_currentReservations, _selectedSite, _index) {
    // _currentReservations is needed to trigger recalculate of class.
    // once _currentReservations being fetched, class will be computed.
    if (_.isEmpty(_currentReservations) || _.isUndefined(_currentReservations)) {
      return '';
    }

    var _siteStatus = _statusCodes[_siteNames.indexOf(_selectedSite)];
    return this[_siteStatus][_index] ? '' : ' fully-occupied';
  },
  _unveilFloor: function(ev) {
    var _target = ev.target;

    if (_target && _target.hasAttribute('floor')) {
      var _floor = (ev.model.item).toLowerCase();
      this.set('selectedFloor', _floor === 'level 3a' ? '04level' :
        _alphaFloorsCode[_alphaFloors.indexOf(_floor)]);
      this.set('selectedFloorName', _floor === 'level 3a' ? 'level 3A' : _floor);
      if (_.isEmpty(this._currentReservations) ||
        _.isUndefined(this._currentReservations)) {
        this.set('_selectedPage', 'waiting');
      }else {
        this.set('_selectedPage', 'room');
      }
    }
  },
  _backSite: function() {
    this.set('selectedFloor', null);
    this.set('selectedFloorName', null);
    this.set('_selectedPage', 'floor');
  },

  _computeRoomsAtSelection: function(_selectedSite, _selectedFloor) {
    // do nothing when _currentReservations is empty/ undefined OR
    // _selectedFloor is null (intended feature at _backFloor)
    if (_.isUndefined(this._currentReservations) ||
      _.isEmpty(this._currentReservations) || _.isEmpty(_selectedFloor)) {
        return [];
    }

    var _decodedSite =
      ['alpha', 'beta', 'gamma'][_siteNames.indexOf(_selectedSite)];
    return this._currentReservations[_decodedSite][_selectedFloor];
  },
  _unveilRoom: function(ev) {
    var _target = ev.target;

    if (_target && _target.hasAttribute('room')) {
      this.set('_infoAtSelectedRoom', [ev.model.item]);
      this.set('selectedRoomName', ev.model.item.name);
      this.set('_selectedPage', 'info');
    }
  },
  _backRoom: function() {
    this.set('selectedRoomName', null);
    this.set('_selectedPage', 'room');
  },
  _isVacantRoom: function(_status) {
    var _cls = '';

    if (_status === 'Occupied') {
      _cls = ' fully-occupied';
    }else if (_status === 'Reserved') {
      _cls = ' reserved';
    }

    return _cls;
  },
  _isRoomLocked: function(_locked) {
    return _locked ? '' : '-open';
  },
  _isRoomLockedMsg: function(_locked) {
    return _locked ? 'This room has restricted access to the public.' :
      'This room is open to the public.';
  },
  _isRoomOccupied: function(_status) {
    return _status.toLowerCase() === 'vacant' ? 'unchecked' : 'checked';
  },

  // workaround for importHref.
  // Nothing shows when switch to other page while the page is loading even it's loaded.
  updateCurrentPages: function() {
    this.$.currentPages.notifyResize();
  },

});
