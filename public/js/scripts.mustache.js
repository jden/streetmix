/*
 * Streetmix
 *
 * Front-end (mostly) by Marcin Wichary, Code for America fellow in 2013.
 *
 * Note: This code is really gnarly. It’s been done under a lot of time 
 * pressure and there’s a lot of shortcut and tech debt. Slowly going through
 * this all.
 */

var main = (function(){
"use strict";
  var main = {};

  // TODO reorder/clean up constants

  var MESSAGES = {
    BUTTON_UNDO: 'Undo',
    BUTTON_REDO: 'Redo',

    UI_DRAG_HERE_TO_REMOVE: 'Drag here to remove',

    PROMPT_NEW_STREET_NAME: 'New street name:',

    MENU_SWITCH_TO_IMPERIAL: 'Switch to imperial units (feet)',
    MENU_SWITCH_TO_METRIC: 'Switch to metric units',

    TOOLTIP_REMOVE_SEGMENT: 'Remove segment',

    STATUS_SEGMENT_DELETED: 'The segment has been deleted.',
    STATUS_ALL_SEGMENTS_DELETED: 'All segments have been deleted.',
    STATUS_NOTHING_TO_UNDO: 'Nothing to undo.',
    STATUS_NOTHING_TO_REDO: 'Nothing to redo.',
    STATUS_NO_NEED_TO_SAVE: 'No need to save by hand; Streetmix automatically saves your street!',
    STATUS_NOW_REMIXING: 'Now editing a freshly-made duplicate of the original street. The duplicate has been put in your gallery.',
    STATUS_NOW_REMIXING_SIGN_IN: 'Now editing a freshly-made duplicate of the original street. <a href="/{{signInUrl}}">Sign in</a> to start your own gallery of streets.',
    STATUS_RELOADED_FROM_SERVER: 'Your street was reloaded from the server as it was modified elsewhere.',
  };

  // TODO all of the below in an array?
  var SITE_URL = 'http://{{app_host_port}}/';
  var API_URL = '{{{restapi_proxy_baseuri_rel}}}/';

  var IP_GEOCODING_API_URL = 'http://freegeoip.net/json/';
  var IP_GEOCODING_TIMEOUT = 1000; // After this time, we don’t wait any more

  var FACEBOOK_APP_ID = '{{facebook_app_id}}';

  // TODO replace the URLs in index.html dynamically
  var URL_SIGN_IN = 'twitter-sign-in';

  var URL_SIGN_IN_CALLBACK_REL = '{{{twitter.oauth_callback_uri}}}';
  var URL_SIGN_IN_CALLBACK_ABS = location.protocol + '//' + location.host + URL_SIGN_IN_CALLBACK_REL;
  var URL_SIGN_IN_CALLBACK = URL_SIGN_IN_CALLBACK_REL.replace(/^\//, '');

  var URL_JUST_SIGNED_IN_REL = '/just-signed-in';
  var URL_JUST_SIGNED_IN_ABS = location.protocol + '//' + location.host + URL_JUST_SIGNED_IN_REL;
  var URL_JUST_SIGNED_IN = URL_JUST_SIGNED_IN_REL.replace(/^\//, '');

  var URL_NEW_STREET = 'new';
  var URL_NEW_STREET_COPY_LAST = 'copy-last';
  var URL_GLOBAL_GALLERY = 'gallery';
  var URL_ERROR = 'error';
  var URL_NO_USER = '-';

  var URL_SIGN_IN_REDIRECT = URL_SIGN_IN + '?callbackUri=' + URL_SIGN_IN_CALLBACK_ABS + '&redirectUri=' + URL_JUST_SIGNED_IN_ABS;

  // Since URLs like “streetmix.net/new” are reserved, but we still want
  // @new to be able to use Streetmix, we prefix any reserved URLs with ~
  var RESERVED_URLS = 
      [URL_SIGN_IN, URL_SIGN_IN_CALLBACK,
      URL_NEW_STREET, URL_NEW_STREET_COPY_LAST,
      URL_JUST_SIGNED_IN,
      'help', URL_GLOBAL_GALLERY, URL_ERROR, 'streets'];
  var URL_RESERVED_PREFIX = '~';

  // TODO these two below should be unified somehow
  var MODE_CONTINUE = 1;
  var MODE_NEW_STREET = 2;
  var MODE_NEW_STREET_COPY_LAST = 3;
  var MODE_JUST_SIGNED_IN = 4;
  var MODE_EXISTING_STREET = 5;
  var MODE_404 = 6;
  var MODE_SIGN_OUT = 7;
  var MODE_FORCE_RELOAD_SIGN_IN = 8;
  var MODE_FORCE_RELOAD_SIGN_OUT = 9;
  var MODE_USER_GALLERY = 10;
  var MODE_GLOBAL_GALLERY = 11;
  var MODE_FORCE_RELOAD_SIGN_OUT_401 = 12;
  var MODE_ERROR = 13;
  var MODE_UNSUPPORTED_BROWSER = 14;

  var ERROR_404 = 1;
  var ERROR_SIGN_OUT = 2;
  var ERROR_NO_STREET = 3; // for gallery if you delete the street you were looking at
  var ERROR_FORCE_RELOAD_SIGN_IN = 4;
  var ERROR_FORCE_RELOAD_SIGN_OUT = 5;
  var ERROR_STREET_DELETED_ELSEWHERE = 6;
  var ERROR_NEW_STREET_SERVER_FAILURE = 7;
  var ERROR_FORCE_RELOAD_SIGN_OUT_401 = 8;
  var ERROR_TWITTER_ACCESS_DENIED = 9;
  var ERROR_AUTH_PROBLEM_NO_TWITTER_REQUEST_TOKEN = 10;
  var ERROR_AUTH_PROBLEM_NO_TWITTER_ACCESS_TOKEN = 11;
  var ERROR_AUTH_PROBLEM_API_PROBLEM = 12;
  var ERROR_GENERIC_ERROR = 13;
  var ERROR_UNSUPPORTED_BROWSER = 14;

  var TWITTER_ID = '@streetmixapp';

  var NEW_STREET_DEFAULT = 1;
  var NEW_STREET_EMPTY = 2;

  var TILESET_IMAGE_VERSION = 14;
  var TILESET_WIDTH = 2622;
  var TILESET_HEIGHT = 384;
  var TILESET_POINT_PER_PIXEL = 2.0;
  var TILE_SIZE = 12; // pixels

  var IMAGES_TO_BE_LOADED = [
    '/images/tiles.png',
    '/images/ui/icons/noun_project_2.svg',
    '/images/ui/icons/noun_project_536.svg',
    '/images/ui/icons/noun_project_97.svg',
    '/images/ui/icons/noun_project_72.svg',
    '/images/ui/icons/noun_project_13130.svg',
    '/images/share-icons/facebook-29.png',
    '/images/share-icons/twitter-32.png'
  ];

  // Output using cmap2file as per 
  // http://www.typophile.com/node/64147#comment-380776
  var STREET_NAME_FONT_GLYPHS = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿĀāĂăĆćĈĉĊċČčĎďĒĔĕĖėĜĝĞğĠġĤĥĨĩĪīĬĭİıĴĵĹĺĽľŁłŃŇňŌōŎŏŐőŒœŔŕŘřŚśŜŝŞşŠšŤťŨũŪūŬŭŮůŰűŴŵŶŷŸŹźŻżŽžƒˆˇ˘˙˚˛˜˝–—‘’‚“”„†‡•…‰‹›⁄€™−';
  var STREET_NAME_REMIX_SUFFIX = '(remixed)';
  var MAX_STREET_NAME_WIDTH = 50;

  var WIDTH_PALETTE_MULTIPLIER = 4;

  var CANVAS_HEIGHT = 480;
  var CANVAS_GROUND = 35;
  var CANVAS_BASELINE = CANVAS_HEIGHT - CANVAS_GROUND;

  var SEGMENT_Y_NORMAL = 265;
  var SEGMENT_Y_PALETTE = 20;
  var PALETTE_EXTRA_SEGMENT_PADDING = 4;

  var DRAG_OFFSET_Y_PALETTE = -340;
  var DRAG_OFFSET_Y_TOUCH_PALETTE = -100;
  var DRAG_OFFSET_Y_TOUCH = -50;

  var WIDTH_CHART_WIDTH = 500;
  var WIDTH_CHART_EMPTY_OWNER_WIDTH = 40;
  var WIDTH_CHART_MARGIN = 20;

  var DRAGGING_TYPE_NONE = 0;
  var DRAGGING_TYPE_MOVE = 1;
  var DRAGGING_TYPE_RESIZE = 2;

  var DRAGGING_TYPE_MOVE_TRANSFER = 1;
  var DRAGGING_TYPE_MOVE_CREATE = 2;

  var DRAGGING_MOVE_HOLE_WIDTH = 40;

  var STATUS_MESSAGE_HIDE_DELAY = 15000;
  var WIDTH_EDIT_INPUT_DELAY = 200;
  var TOUCH_SEGMENT_FADEOUT_DELAY = 5000;
  var SHORT_DELAY = 100;

  var SAVE_STREET_DELAY = 500;
  var SAVE_SETTINGS_DELAY = 500;
  var NO_CONNECTION_MESSAGE_TIMEOUT = 10000;

  var BLOCKING_SHIELD_DARKEN_DELAY = 800;
  var BLOCKING_SHIELD_TOO_SLOW_DELAY = 10000;

  var MAX_DRAG_DEGREE = 20;

  var UNDO_LIMIT = 100;

  var STREET_WIDTH_CUSTOM = -1;
  var STREET_WIDTH_SWITCH_TO_METRIC = -2;
  var STREET_WIDTH_SWITCH_TO_IMPERIAL = -3;

  var DEFAULT_NAME = 'Unnamed St';
  var DEFAULT_STREET_WIDTH = 80;
  var DEFAULT_STREET_WIDTHS = [40, 60, 80];

  var MIN_CUSTOM_STREET_WIDTH = 10;
  var MAX_CUSTOM_STREET_WIDTH = 200;
  var MIN_SEGMENT_WIDTH = 2;
  var MAX_SEGMENT_WIDTH = 150;

  var RESIZE_TYPE_INITIAL = 0;
  var RESIZE_TYPE_INCREMENT = 1;
  var RESIZE_TYPE_DRAGGING = 2;
  var RESIZE_TYPE_PRECISE_DRAGGING = 3;
  var RESIZE_TYPE_TYPING = 4;

  var IMPERIAL_METRIC_MULTIPLIER = 30 / 100;
  var COUNTRIES_IMPERIAL_UNITS = ['US'];
  var COUNTRIES_LEFT_HAND_TRAFFIC = 
      ['GG', 'AI', 'AG', 'AU', 'BS', 'BD', 'BB', 'BM', 'BT', 'BW', 'BN',
       'KY', 'CX', 'CC', 'CK', 'CY', 'DM', 'TL', 'FK', 'FJ', 'GD', 'GG',
       'GY', 'HK', 'IN', 'ID', 'IE', 'IM', 'JM', 'JP', 'JE', 'KE', 'KI',
       'LS', 'MO', 'MW', 'MY', 'MV', 'MT', 'MU', 'MS', 'MZ', 'NA', 'NR',
       'NP', 'NZ', 'NU', 'NF', 'PK', 'PG', 'PN', 'SH', 'KN', 'LC', 'VC',
       'WS', 'SC', 'SG', 'SB', 'ZA', 'LK', 'SR', 'SZ', 'TZ', 'TH', 'TK',
       'TO', 'TT', 'TC', 'TV', 'UG', 'GB', 'VG', 'VI', 'ZM', 'ZW'];

  var WIDTH_INPUT_CONVERSION = [
    { text: 'm', multiplier: 1 / IMPERIAL_METRIC_MULTIPLIER },
    { text: 'cm', multiplier: 1 / 100 / IMPERIAL_METRIC_MULTIPLIER },
    { text: '"', multiplier: 1 / 12 },
    { text: 'inch', multiplier: 1 / 12 },
    { text: 'inches', multiplier: 1 / 12 },
    { text: '\'', multiplier: 1 },
    { text: 'ft', multiplier: 1 },
    { text: 'feet', multiplier: 1 }
  ];

  var SEGMENT_WIDTH_RESOLUTION_IMPERIAL = .25;
  var SEGMENT_WIDTH_CLICK_INCREMENT_IMPERIAL = .5;
  var SEGMENT_WIDTH_DRAGGING_RESOLUTION_IMPERIAL = .5;

  // don't use const because of rounding problems
  var SEGMENT_WIDTH_RESOLUTION_METRIC = 1 / 3; // .1 / IMPERIAL_METRIC_MULTIPLER
  var SEGMENT_WIDTH_CLICK_INCREMENT_METRIC = 2 / 3; // .2 / IMPERIAL_METRIC_MULTIPLER
  var SEGMENT_WIDTH_DRAGGING_RESOLUTION_METRIC = 2 / 3; // .2 / IMPERIAL_METRIC_MULTIPLER

  var MIN_WIDTH_EDIT_CANVAS_WIDTH = 120;
  var WIDTH_EDIT_MARGIN = 20;

  var NORMALIZE_PRECISION = 5;
  var METRIC_PRECISION = 3;
  var WIDTH_ROUNDING = .01;

  var SEGMENT_WARNING_OUTSIDE = 1;
  var SEGMENT_WARNING_WIDTH_TOO_SMALL = 2;
  var SEGMENT_WARNING_WIDTH_TOO_LARGE = 3;

  var KEY_LEFT_ARROW = 37;
  var KEY_RIGHT_ARROW = 39;
  var KEY_ENTER = 13;
  var KEY_BACKSPACE = 8;
  var KEY_DELETE = 46;
  var KEY_ESC = 27;
  var KEY_D = 68;
  var KEY_S = 83;
  var KEY_Y = 89;
  var KEY_Z = 90;
  var KEY_EQUAL = 187; // = or +
  var KEY_MINUS = 189;

  var PRETTIFY_WIDTH_OUTPUT_MARKUP = 1;
  var PRETTIFY_WIDTH_OUTPUT_NO_MARKUP = 2;
  var PRETTIFY_WIDTH_INPUT = 3;

  var SETTINGS_UNITS_IMPERIAL = 1;
  var SETTINGS_UNITS_METRIC = 2;

  var IMPERIAL_VULGAR_FRACTIONS = {
    '.125': '⅛',
    '.25': '¼',
    '.375': '⅜',
    '.5': '½',
    '.625': '⅝',
    '.75': '¾',
    '.875': '⅞'
  };  

  var CSS_TRANSFORMS = ['webkitTransform', 'MozTransform', 'transform'];

  var SEGMENT_OWNER_CAR = 'car';
  var SEGMENT_OWNER_BIKE = 'bike';
  var SEGMENT_OWNER_PEDESTRIAN = 'pedestrian';
  var SEGMENT_OWNER_PUBLIC_TRANSIT = 'public-transit';
  var SEGMENT_OWNER_NATURE = 'nature';

  var VARIANT_SEPARATOR = '|';

  var SEGMENT_OWNERS = {
    'car': {
      owner: SEGMENT_OWNER_CAR,
      imageUrl: '/images/ui/icons/noun_project_72.svg',
      imageSize: .8
    },
    'public-transit': {
      owner: SEGMENT_OWNER_PUBLIC_TRANSIT,
      imageUrl: '/images/ui/icons/noun_project_97.svg',
      imageSize: .8
    },
    'bike': {
      owner: SEGMENT_OWNER_BIKE,
      imageUrl: '/images/ui/icons/noun_project_536.svg',
      imageSize: 1.1
    },
    'pedestrian': {
      owner: SEGMENT_OWNER_PEDESTRIAN,
      imageUrl: '/images/ui/icons/noun_project_2.svg',
      imageSize: .8
    },
    'nature': {
      owner: SEGMENT_OWNER_NATURE,
      imageUrl: '/images/ui/icons/noun_project_13130.svg',
      imageSize: .8
    }
  };

  var VARIANTS = {
    'direction': ['inbound', 'outbound'],
    'tree-size': ['small', 'big'],
    'lamp-orientation': ['left', 'both', 'right'],
    'parking-lane-orientation': ['left', 'right'],
    'turn-lane-orientation': ['left', 'right'],
  };

  var SEGMENT_INFO = {
    'sidewalk': {
      name: 'Sidewalk',
      owner: SEGMENT_OWNER_PEDESTRIAN,
      defaultWidth: 6,
      variants: [''],
      details: {
        '': {
          minWidth: 6,
          graphics: {
            center: { x: 3, y: 5, width: 4, height: 15 },
            repeat: { x: 1, y: 5, width: 1, height: 15 }
          }          
        }
      }
    },
    'sidewalk-tree': {
      name: 'Sidewalk w/ a tree',
      owner: SEGMENT_OWNER_NATURE,
      //zIndex: -1,
      defaultWidth: 4,
      variants: ['tree-size'],
      details: {
        'small': {
          graphics: {
            center: { x: 13, y: 5, width: 6, height: 15 },
            repeat: { x: 1, y: 5, width: 1, height: 15 }
          }
        },
        'big': {
          graphics: {
            center: { x: 158, y: 0, width: 11, height: 20, offsetY: -5 },
            repeat: { x: 1, y: 5, width: 1, height: 15 }
          }
        }
      }
    },
    'sidewalk-lamp': {
      name: 'Sidewalk w/ a lamp',
      owner: SEGMENT_OWNER_PEDESTRIAN,
      defaultWidth: 4,
      variants: ['lamp-orientation'],
      details: {
        'right': {
          graphics: {
            center: { width: 0, height: 15 },
            repeat: { x: 1, y: 5, width: 1, height: 15 },
            right: { x: 102, y: 0, offsetX: -2, offsetY: -5, width: 4, height: 20 }
          }
        },
        'both': {
          graphics: {
            center: { x: 150, y: 0, offsetY: -5, width: 6, height: 20 },
            repeat: { x: 1, y: 5, width: 1, height: 15 },
          }          
        },
        'left': {
          graphics: {
            center: { width: 0, height: 15 },
            repeat: { x: 1, y: 5, width: 1, height: 15 },
            left: { x: 107, y: 0, offsetX: -2, offsetY: -5, width: 4, height: 20 }
          }
        }
      }
    },
    'planting-strip': {
      name: 'Planting strip',
      owner: SEGMENT_OWNER_NATURE,
      defaultWidth: 4,
      variants: [''],
      details: {
        '': {
          graphics: {
            center: { width: 0, height: 15 },
            repeat: { x: 8, y: 5, width: 4, height: 15 }
          }          
        }
      }
    },
    'bike-lane': {
      name: 'Bike lane',
      owner: SEGMENT_OWNER_BIKE,
      defaultWidth: 6,
      variants: ['direction'],
      details: {
        'inbound': {
          graphics: {
            center: { x: 92, y: 5, width: 4, height: 15 },
            repeat: { x: 90, y: 5, width: 1, height: 15 }
          }
        },
        'outbound': {
          graphics: {
            center: { x: 97, y: 5, width: 4, height: 15 },
            repeat: { x: 90, y: 5, width: 1, height: 15 }
          }
        }
      }
    },
    'drive-lane': {
      name: 'Drive lane',
      owner: SEGMENT_OWNER_CAR,
      defaultWidth: 10,
      variants: ['direction'],
      details: {
        'inbound': {
          minWidth: 9,
          maxWidth: 12,
          graphics: {
            center: { x: 28, y: 5, width: 8, height: 15 },
            repeat: { x: 26, y: 5, width: 1, height: 15 }
          }          
        },
        'outbound': {
          minWidth: 9,
          maxWidth: 12,
          graphics: {
            center: { x: 37, y: 5, width: 8, height: 15 },
            repeat: { x: 26, y: 5, width: 1, height: 15 }
          }          
        }
      }
    },
    'turn-lane': {
      name: 'Turn lane',
      owner: SEGMENT_OWNER_CAR,
      defaultWidth: 10,
      variants: ['direction', 'turn-lane-orientation'],
      details: {
        'inbound|left': {
          minWidth: 9,
          maxWidth: 12,
          graphics: {
            center: { x: 123, y: 5, width: 8, height: 15 },
            repeat: { x: 26, y: 5, width: 1, height: 15 }
          }          
        },
        'inbound|right': {
          minWidth: 9,
          maxWidth: 12,
          graphics: {
            center: { x: 81, y: 5, width: 8, height: 15 },
            repeat: { x: 26, y: 5, width: 1, height: 15 }
          }          
        },
        'outbound|left': {
          minWidth: 9,
          maxWidth: 12,
          graphics: {
            center: { x: 132, y: 5, width: 8, height: 15 },
            repeat: { x: 26, y: 5, width: 1, height: 15 }
          }          
        },
        'outbound|right': {
          minWidth: 9,
          maxWidth: 12,
          graphics: {
            center: { x: 141, y: 5, width: 8, height: 15 },
            repeat: { x: 26, y: 5, width: 1, height: 15 }
          }          
        }
      }
    },
    'parking-lane': {
      name: 'Parking lane',
      owner: SEGMENT_OWNER_CAR,
      defaultWidth: 8,
      variants: ['direction', 'parking-lane-orientation'],
      details: {
        'inbound|left': {
          minWidth: 8,
          maxWidth: 10,
          graphics: {
            center: { x: 50, y: 5, width: 8, height: 15 },
            repeat: { x: 26, y: 5, width: 1, height: 15 },
            right: { x: 112, y: 5, width: 2, height: 15 }
          }
        },
        'inbound|right': {
          minWidth: 8,
          maxWidth: 10,
          graphics: {
            center: { x: 50, y: 5, width: 8, height: 15 },
            repeat: { x: 26, y: 5, width: 1, height: 15 },
            left: { x: 46, y: 5, width: 2, height: 15 }
          }
        },
        'outbound|left': {
          minWidth: 8,
          maxWidth: 10,
          graphics: {
            center: { x: 115, y: 5, width: 8, height: 15 },
            repeat: { x: 26, y: 5, width: 1, height: 15 },
            right: { x: 112, y: 5, width: 2, height: 15 }
          }
        },
        'outbound|right': {
          minWidth: 8,
          maxWidth: 10,
          graphics: {
            center: { x: 115, y: 5, width: 8, height: 15 },
            repeat: { x: 26, y: 5, width: 1, height: 15 },
            left: { x: 46, y: 5, width: 2, height: 15 }
          }
        }
      }      
    },
    'bus-lane': {
      name: 'Bus lane',
      owner: SEGMENT_OWNER_PUBLIC_TRANSIT,
      defaultWidth: 10,
      variants: ['direction'],
      details: {
        'inbound': {
          minWidth: 9,
          maxWidth: 12,
          graphics: {
            center: { x: 59, y: 5, width: 10, height: 15 },
            repeat: { x: 26, y: 5, width: 1, height: 15 }
          }
        },
        'outbound': {
          minWidth: 9,
          maxWidth: 12,
          graphics: {
            center: { x: 70, y: 5, width: 10, height: 15 },
            repeat: { x: 26, y: 5, width: 1, height: 15 }
          }
        }
      }
    },
    'small-median': {
      name: 'Small median',
      owner: SEGMENT_OWNER_CAR,
      defaultWidth: 4,
      variants: [''],
      details: {
        '': {
          graphics: {
            center: { x: 22, y: 5, width: 3, height: 15 },
            repeat: { x: 20, y: 5, width: 1, height: 15 }
          }          
        }
      }
    },
  };

  var DEFAULT_SEGMENTS = {
    false: [ // Right-hand traffic
      { type: "sidewalk", width: 6 },
      { type: "sidewalk-tree", variant: { 'tree-size': 'big' }, width: 4 },
      { type: "sidewalk-lamp", variant: { 'lamp-orientation': 'right' }, width: 2 },
      { type: "bike-lane", variant: { 'direction': 'inbound' }, width: 6 },
      { type: "drive-lane", variant: { 'direction': 'inbound' }, width: 10 },
      { type: "drive-lane", variant: { 'direction': 'inbound' }, width: 10 },
      { type: "sidewalk-lamp", variant: { 'lamp-orientation': 'both' }, width: 4 },
      { type: "drive-lane", variant: { 'direction': 'outbound' }, width: 10 },
      { type: "drive-lane", variant: { 'direction': 'outbound' }, width: 10 },
      { type: "bike-lane", variant: { 'direction': 'outbound' }, width: 6 },
      { type: "sidewalk-lamp", variant: { 'lamp-orientation': 'left' }, width: 2 },
      { type: "sidewalk-tree", variant: { 'tree-size': 'big' }, width: 4 },
      { type: "sidewalk", width: 6 }
    ],
    true: [ // Left-hand traffic
      { type: "sidewalk", width: 6 },
      { type: "sidewalk-tree", variant: { 'tree-size': 'big' }, width: 4 },
      { type: "sidewalk-lamp", variant: { 'lamp-orientation': 'right' }, width: 2 },
      { type: "bike-lane", variant: { 'direction': 'outbound' }, width: 6 },
      { type: "drive-lane", variant: { 'direction': 'outbound' }, width: 10 },
      { type: "drive-lane", variant: { 'direction': 'outbound' }, width: 10 },
      { type: "sidewalk-lamp", variant: { 'lamp-orientation': 'both' }, width: 4 },
      { type: "drive-lane", variant: { 'direction': 'inbound' }, width: 10 },
      { type: "drive-lane", variant: { 'direction': 'inbound' }, width: 10 },
      { type: "bike-lane", variant: { 'direction': 'inbound' }, width: 6 },
      { type: "sidewalk-lamp", variant: { 'lamp-orientation': 'left' }, width: 2 },
      { type: "sidewalk-tree", variant: { 'tree-size': 'big' }, width: 4 },
      { type: "sidewalk", width: 6 }
    ]
  };

  var USER_ID_COOKIE = 'user_id';
  var SIGN_IN_TOKEN_COOKIE = 'login_token';

  var LOCAL_STORAGE_SETTINGS_ID = 'settings';
  var LOCAL_STORAGE_SIGN_IN_ID = 'sign-in';
  var LOCAL_STORAGE_FEEDBACK_BACKUP = 'feedback-backup';
  var LOCAL_STORAGE_FEEDBACK_EMAIL_BACKUP = 'feedback-email-backup';

  // TODO clean up/rearrange variables

  // Saved data
  // ------------------------------------------------------------------------

  var street = {
    id: null,
    creatorId: null,
    namespacedId: null,
    originalStreetId: null, // id of the street the current street is remixed from (could be null)
    name: null,

    width: null,
    occupiedWidth: null, // Can be recreated, do not save
    remainingWidth: null, // Can be recreated, do not save

    segments: [],

    units: null
  };

  var lastStreet;
  
  var undoStack = [];
  var undoPosition = 0;
  var ignoreStreetChanges = false;  

  var settings = {
    lastStreetId: null,
    lastStreetNamespacedId: null,
    lastStreetUserId: null,
    priorLastStreetId: null, // Do not save
    newStreetPreference: null
  };

  var units = SETTINGS_UNITS_IMPERIAL;

  var leftHandTraffic = false;

  var ignoreWindowFocus = false;

  var images = [];

  var avatarCache = {};

  // ------------------------------------------------------------------------

  var mode;
  var errorUrl = '';
  var abortEverything;
  var currentErrorType;

  var draggingType = DRAGGING_TYPE_NONE;

  var draggingResize = {
    segmentEl: null,
    floatingEl: null,
    mouseX: null,
    mouseY: null,
    elX: null,
    elY: null,
    originalX: null,
    originalWidth: null,
    originalType: null,
    originalVariantString: null,
    right: false
  };

  var draggingMove = {
    type: null,
    active: false,
    segmentBeforeEl: null,
    segmentAfterEl: null,
    mouseX: null,
    mouseY: null,
    el: null,
    elX: null,
    elY: null,
    originalEl: null,
    originalWidth: null,
    floatingElVisible: false
  };

  var initializing = false;

  var widthEditHeld = false;
  var resizeSegmentTimerId = -1;

  var infoBubbleVisible = false;
  var infoButtonHoverTimerId = -1;

  var galleryVisible = false;

  var streetSectionCanvasLeft;

  var images;
  var imagesToBeLoaded;

  var bodyLoaded;
  var readyStateCompleteLoaded;  
  var countryLoaded;
  var serverContacted;

  var saveStreetTimerId = -1;
  var saveStreetIncomplete = false;
  var remixOnFirstEdit = false;
  var saveSettingsTimerId = -1;

  var signedIn = false;
  var signInLoaded = false;
  var signInData = null;

  // Auto “promote” (remix) the street if you just signed in and the street
  // was anonymous
  var promoteStreet = false;

  var mouseX;
  var mouseY;

  var system = {
    apiUrl: null,
    touch: false,
    hiDpi: 1.0,
    cssTransform: false,
    ipAddress: null
  };

  var segmentWidthResolution;
  var segmentWidthClickIncrement;
  var segmentWidthDraggingResolution;

  var galleryUserId = null;
  var galleryStreetId = null;
  var galleryStreetLoaded = false;

  var nonblockingAjaxRequests = [];
  //var nonblockingAjaxRequestCount = 0;

  var nonblockingAjaxRequestTimer = 0;

  var NON_BLOCKING_AJAX_REQUEST_TIME = [10, 500, 1000, 5000, 10000];
  var NON_BLOCKING_AJAX_REQUEST_BACKOFF_RANGE = 60000;

  var NON_BLOCKING_NO_CONNECTION_MESSAGE_TIMER_COUNT = 4;

  //0-4 seconds 2^2
  //0-8 seconds 2^3

  var blockingAjaxRequest;
  var blockingAjaxRequestDoneFunc;
  var blockingAjaxRequestCancelFunc;
  var blockingAjaxRequestInProgress = false;

  var blockingShieldTimerId = -1;
  var blockingShieldTooSlowTimerId = -1;

  // HELPER FUNCTIONS
  // -------------------------------------------------------------------------

  function htmlEncode(value){
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
  }


  function msg(messageId, data) {
    if (data) {
      return MESSAGES[messageId].supplant(data);
    } else {
      return MESSAGES[messageId];
    }
  }

  String.prototype.supplant = function (o) {
    return this.replace(/{{([^{}]*)}}/g,
      function (a, b) {
        var r = o[b];
        return typeof r === 'string' || typeof r === 'number' ? r : a;
      }
    );
  };

  function _createTimeout(fn, data, delay) {
    window.setTimeout(function() { fn.call(null, data); }, delay);
  }

  function _removeElFromDom(el) {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  function _getElAbsolutePos(el) {
    var pos = [0, 0];

    do {
      pos[0] += el.offsetLeft + (el.cssTransformLeft || 0);
      pos[1] += el.offsetTop + (el.cssTransformTop || 0);

      el = el.offsetParent;
    } while (el);

    return pos;
  }

  function _clone(obj) {
    if (jQuery.isArray(obj)) {
      return jQuery.extend(true, [], obj);
    } else {  
      return jQuery.extend(true, {}, obj);
    }
  }

  // -------------------------------------------------------------------------

  function _drawSegmentImage(ctx, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (!sw || !sh || !dw || !dh) {
      return;
    }

    if (imagesToBeLoaded == 0) {
      ctx.drawImage(images['/images/tiles.png'],
          sx * TILESET_POINT_PER_PIXEL, sy * TILESET_POINT_PER_PIXEL, 
          sw * TILESET_POINT_PER_PIXEL, sh * TILESET_POINT_PER_PIXEL,
          dx * system.hiDpi, dy * system.hiDpi, 
          dw * system.hiDpi, dh * system.hiDpi);
    }
  }

 function _setSegmentContents(el, type, variantString, segmentWidth, palette) {
    var segmentInfo = SEGMENT_INFO[type];
    var variantInfo = SEGMENT_INFO[type].details[variantString];

    if (variantInfo.graphics.center && 
        typeof variantInfo.graphics.center.width != 'undefined') {
      var realWidth = variantInfo.graphics.center.width;
    } else {
      var realWidth = segmentInfo.defaultWidth;
    }

    var multiplier = palette ? (WIDTH_PALETTE_MULTIPLIER / TILE_SIZE) : 1;

    var bkPositionX = (variantInfo.graphics.center.x || 0) * TILE_SIZE;
    var bkPositionY = (variantInfo.graphics.center.y || 0) * TILE_SIZE;

    var left = 0;
    var top = palette ? SEGMENT_Y_PALETTE : SEGMENT_Y_NORMAL;
    var width = realWidth * TILE_SIZE;
    var height = CANVAS_BASELINE;

    // center properly
    var segmentRealWidth = segmentWidth / TILE_SIZE / multiplier;
    left += (segmentRealWidth - realWidth) * TILE_SIZE / 2;

    // sticking out
    var maxWidth = segmentWidth;
    if (!palette) {
      if (maxWidth < realWidth * TILE_SIZE) {
        maxWidth = realWidth * TILE_SIZE;

        left = 0;
      }
    }

    var canvasLeft = (segmentWidth - maxWidth) / 2;

    var canvasOffsetX = 0;

    if (variantInfo.graphics.left && variantInfo.graphics.left.offsetX < 0) {
      var leftOffset = -variantInfo.graphics.left.offsetX * TILE_SIZE;

      canvasLeft -= leftOffset;
      maxWidth += leftOffset;
    }

    if (variantInfo.graphics.right && variantInfo.graphics.right.offsetX < 0) {
      canvasOffsetX = -variantInfo.graphics.right.offsetX * TILE_SIZE;

      maxWidth += canvasOffsetX;
    }

    var hoverBkEl = document.createElement('div');
    hoverBkEl.classList.add('hover-bk');


    var canvasEl = document.createElement('canvas');
    canvasEl.classList.add('image');
    canvasEl.width = maxWidth * system.hiDpi;
    canvasEl.height = height * system.hiDpi;
    canvasEl.style.width = maxWidth + 'px';
    canvasEl.style.height = height + 'px';

    if (!palette) {
      canvasEl.style.left = canvasLeft + 'px';
    } else {
      canvasEl.style.left = 0;
    }

    var ctx = canvasEl.getContext('2d');

    if (variantInfo.graphics.repeat) {
      var repeatPositionX = variantInfo.graphics.repeat.x * TILE_SIZE;
      var repeatPositionY = (variantInfo.graphics.repeat.y || 0) * TILE_SIZE;
      var w = variantInfo.graphics.repeat.width * TILE_SIZE * multiplier;

      var count = Math.floor((segmentWidth) / w + 1);

      if (segmentWidth < maxWidth) {
        var repeatStartX = -canvasLeft;
      } else {
        var repeatStartX = -(segmentWidth - maxWidth) - canvasOffsetX;
      }

      if (palette) {
        repeatStartX = 0;
      }

      for (var i = 0; i < count; i++) {
        // remainder
        if (i == count - 1) {
          w = segmentWidth - (count - 1) * w;
        }

        _drawSegmentImage(ctx,
          repeatPositionX, repeatPositionY, 
          w, variantInfo.graphics.repeat.height * TILE_SIZE, 
          (repeatStartX + (i * variantInfo.graphics.repeat.width) * TILE_SIZE) * multiplier, 
          top + (multiplier * TILE_SIZE * (variantInfo.graphics.repeat.offsetY || 0)), 
          w, 
          variantInfo.graphics.repeat.height * TILE_SIZE * multiplier);
      }
    }      

    if (variantInfo.graphics.left) {
      var leftPositionX = variantInfo.graphics.left.x * TILE_SIZE;
      var leftPositionY = (variantInfo.graphics.left.y || 0) * TILE_SIZE;

      var w = variantInfo.graphics.left.width * TILE_SIZE;

      _drawSegmentImage(ctx,
          leftPositionX, leftPositionY, 
          w, variantInfo.graphics.left.height * TILE_SIZE, 
          0,
          top + (multiplier * TILE_SIZE * (variantInfo.graphics.left.offsetY || 0)), 
          w * multiplier, variantInfo.graphics.left.height * TILE_SIZE * multiplier);
    }

    if (variantInfo.graphics.right) {
      var rightPositionX = variantInfo.graphics.right.x * TILE_SIZE;
      var rightPositionY = (variantInfo.graphics.right.y || 0) * TILE_SIZE;

      var w = variantInfo.graphics.right.width * TILE_SIZE;

      var rightTargetX = maxWidth - variantInfo.graphics.right.width * TILE_SIZE * multiplier;

      if (palette) {
        rightTargetX += (variantInfo.graphics.right.offsetX || 0) * TILE_SIZE;
      }

      _drawSegmentImage(ctx,
        rightPositionX, rightPositionY, 
        w, variantInfo.graphics.right.height * TILE_SIZE,
        rightTargetX,
        top + (multiplier * TILE_SIZE * (variantInfo.graphics.right.offsetY || 0)), 
        w * multiplier, variantInfo.graphics.right.height * TILE_SIZE * multiplier);
    }

    _drawSegmentImage(ctx,
      bkPositionX, bkPositionY, 
      width, variantInfo.graphics.center.height * TILE_SIZE, 
      left * multiplier, 
      top + (multiplier * TILE_SIZE * (variantInfo.graphics.center.offsetY || 0)), 
      width * multiplier, variantInfo.graphics.center.height * TILE_SIZE * multiplier);

    _removeElFromDom(el.querySelector('canvas'));
    el.appendChild(canvasEl);

    _removeElFromDom(el.querySelector('.hover-bk'));
    el.appendChild(hoverBkEl);
  }


  function _onWidthEditClick(event) {
    var el = event.target;

    el.hold = true;
    widthEditHeld = true;

    if (document.activeElement != el) {
      el.select();
    }
  }

  function _onWidthEditMouseOver(event) {
    if (!widthEditHeld) {
      event.target.focus();
      event.target.select();
    }
  }

  function _onWidthEditMouseOut(event) {
    var el = event.target;
    if (!widthEditHeld) {
      _loseAnyFocus();
    }
  }

  function _loseAnyFocus() {
    document.body.focus();
  }

  function _onWidthEditFocus(event) {
    var el = event.target;

    el.oldValue = el.realValue;
    el.value = _prettifyWidth(el.realValue, PRETTIFY_WIDTH_INPUT);
  }

  function _onWidthEditBlur(event) {
    var el = event.target;

    _widthEditInputChanged(el, true);

    el.realValue = parseFloat(el.segmentEl.getAttribute('width'));
    el.value = _prettifyWidth(el.realValue, PRETTIFY_WIDTH_OUTPUT_NO_MARKUP);

    el.hold = false;
    widthEditHeld = false;
  }

  function _processWidthInput(widthInput) {
    widthInput = widthInput.replace(/ /g, '');
    widthInput = widthInput.replace(/,/g, '.');

    for (var i in IMPERIAL_VULGAR_FRACTIONS) {
      if (widthInput.indexOf(IMPERIAL_VULGAR_FRACTIONS[i]) != -1) {
        widthInput = widthInput.replace(new RegExp(IMPERIAL_VULGAR_FRACTIONS[i]), i);
      }
    }

    var width = parseFloat(widthInput);

    if (width) {
      // Default unit
      switch (street.units) {
        case SETTINGS_UNITS_METRIC:
          var multiplier = 1 / IMPERIAL_METRIC_MULTIPLIER;
          break;
        case SETTINGS_UNITS_IMPERIAL:
          var multiplier = 1;
          break;
      }

      for (var i in WIDTH_INPUT_CONVERSION) {
        if (widthInput.match(new RegExp("[\\d\\.]" + 
              WIDTH_INPUT_CONVERSION[i].text + "$"))) {
          var multiplier = WIDTH_INPUT_CONVERSION[i].multiplier;
          break;
        }
      }

      width *= multiplier;
    }

    return width;
  }

  function _widthEditInputChanged(el, immediate) {
    window.clearTimeout(resizeSegmentTimerId);

    var width = _processWidthInput(el.value);

    if (width) {
      var segmentEl = el.segmentEl;

      if (immediate) {
        _resizeSegment(segmentEl, RESIZE_TYPE_TYPING, 
            width * TILE_SIZE, false, false, true);
      } else {
        resizeSegmentTimerId = window.setTimeout(function() {
          _resizeSegment(segmentEl, RESIZE_TYPE_TYPING,
          width * TILE_SIZE, false, false, true);
        }, WIDTH_EDIT_INPUT_DELAY);
      }
    } else {
      
    }
  }

  function _onWidthEditInput(event) {
    _widthEditInputChanged(event.target, false);
  }

  function _onWidthEditKeyDown(event) {
    var el = event.target;

    switch (event.keyCode) {
      case KEY_ENTER:
        _widthEditInputChanged(el, true);
        _loseAnyFocus();
        el.value = _prettifyWidth(el.segmentEl.getAttribute('width'), PRETTIFY_WIDTH_INPUT);
        el.focus();
        el.select();
        break;
      case KEY_ESC:
        el.value = el.oldValue;
        _widthEditInputChanged(el, true);
        _hideMenus();
        _loseAnyFocus();
        break;
    }
  }

  function _normalizeStreetWidth(width) {
    if (width < MIN_CUSTOM_STREET_WIDTH) {
      width = MIN_CUSTOM_STREET_WIDTH;
    } else if (width > MAX_CUSTOM_STREET_WIDTH) {
      width = MAX_CUSTOM_STREET_WIDTH;
    }

    var resolution = segmentWidthResolution;

    width = 
        Math.round(width / resolution) * resolution;

    return width;    
  }

  function _normalizeSegmentWidth(width, resizeType) {
    if (width < MIN_SEGMENT_WIDTH) {
      width = MIN_SEGMENT_WIDTH;
    } else if (width > MAX_SEGMENT_WIDTH) {
      width = MAX_SEGMENT_WIDTH;
    }    

    switch (resizeType) {
      case RESIZE_TYPE_INITIAL:
      case RESIZE_TYPE_TYPING:
      case RESIZE_TYPE_INCREMENT:
      case RESIZE_TYPE_PRECISE_DRAGGING:
        var resolution = segmentWidthResolution;
        break;
      case RESIZE_TYPE_DRAGGING:
        var resolution = segmentWidthDraggingResolution;
        break;
    }

    width = Math.round(width / resolution) * resolution;
    width = parseFloat(width.toFixed(NORMALIZE_PRECISION));

    return width;
  }

  function _prettifyWidth(width, purpose) {
    var remainder = width - Math.floor(width);

    switch (street.units) {
      case SETTINGS_UNITS_IMPERIAL:
        var widthText = width;

        if (purpose != PRETTIFY_WIDTH_INPUT) {
          if (IMPERIAL_VULGAR_FRACTIONS[('' + remainder).substr(1)]) {
            var widthText = 
                (Math.floor(width) ? Math.floor(width) : '') + 
                IMPERIAL_VULGAR_FRACTIONS[('' + remainder).substr(1)];      
          }
        }

        switch (purpose) {
          case PRETTIFY_WIDTH_OUTPUT_NO_MARKUP:
            widthText += '\'';
            break;
          case PRETTIFY_WIDTH_OUTPUT_MARKUP:
            widthText += '<wbr>\'';
            break;
        }
        break;
      case SETTINGS_UNITS_METRIC:
        var widthText = '' + 
            (width * IMPERIAL_METRIC_MULTIPLIER).toFixed(METRIC_PRECISION);

        if (widthText.substr(0, 2) == '0.') {
          widthText = widthText.substr(1);
        }
        while (widthText.substr(widthText.length - 1) == '0') {
          widthText = widthText.substr(0, widthText.length - 1);
        }
        if (widthText.substr(widthText.length - 1) == '.') {
          widthText = widthText.substr(0, widthText.length - 1);
        }

        switch (purpose) {
          case PRETTIFY_WIDTH_OUTPUT_NO_MARKUP:
            widthText += ' m';
            break;
          case PRETTIFY_WIDTH_OUTPUT_MARKUP:
            widthText += '<wbr> m';          
            break;
        }
        break;
    }

    return widthText;
  }

  function _incrementSegmentWidth(segmentEl, add, precise) {
    var width = parseFloat(segmentEl.getAttribute('width'));

    if (precise) {
      var increment = segmentWidthResolution;
    } else {
      var increment = segmentWidthClickIncrement;
    }

    if (!add) {
      increment = -increment;
    }
    width = _normalizeSegmentWidth(width + increment, RESIZE_TYPE_INCREMENT);

    _resizeSegment(segmentEl, RESIZE_TYPE_INCREMENT,
        width * TILE_SIZE, true, false, true);
  }

  function _onWidthDecrementClick(event) {
    var el = event.target;
    var segmentEl = el.segmentEl;
    var precise = event.shiftKey;
    
    _incrementSegmentWidth(segmentEl, false, precise);
    _createTouchSegmentFadeout(segmentEl);
  }

  function _onWidthIncrementClick(event) {
    var el = event.target;
    var segmentEl = el.segmentEl;
    var precise = event.shiftKey;

    _incrementSegmentWidth(segmentEl, true, precise);
    _createTouchSegmentFadeout(segmentEl);
  }

  function _resizeSegment(el, resizeType, width, updateEdit, palette, immediate, initial) {
    if (!palette) {
      var width = 
          _normalizeSegmentWidth(width / TILE_SIZE, resizeType) * TILE_SIZE;
    }

    if (immediate) {
      document.body.classList.add('immediate-segment-resize');

      window.setTimeout(function() {
        document.body.classList.remove('immediate-segment-resize');
      }, SHORT_DELAY);
    }

    el.style.width = width + 'px';
    el.setAttribute('width', width / TILE_SIZE);

    var widthEl = el.querySelector('span.width');
    if (widthEl) {
      widthEl.innerHTML = 
          _prettifyWidth(width / TILE_SIZE, PRETTIFY_WIDTH_OUTPUT_MARKUP);
    }

    _setSegmentContents(el, el.getAttribute('type'), 
      el.getAttribute('variant-string'), width, palette);

    if (updateEdit) {
      var value = width / TILE_SIZE;

      var editEl = el.querySelector('.width-edit');
      if (editEl) {
        editEl.realValue = value;
        editEl.value = _prettifyWidth(value, PRETTIFY_WIDTH_OUTPUT_NO_MARKUP);
      } else {
        var editEl = el.querySelector('.width-edit-placeholder');
        if (editEl) {
          editEl.innerHTML = _prettifyWidth(value, PRETTIFY_WIDTH_OUTPUT_MARKUP);
        }
      }
    }

    var widthEditCanvasEl = el.querySelector('.width-edit-canvas');

    if (widthEditCanvasEl) {
      if (width < MIN_WIDTH_EDIT_CANVAS_WIDTH) {
        widthEditCanvasEl.style.width = MIN_WIDTH_EDIT_CANVAS_WIDTH + 'px';
        widthEditCanvasEl.style.marginLeft = 
            ((width - MIN_WIDTH_EDIT_CANVAS_WIDTH) / 2 - WIDTH_EDIT_MARGIN) + 'px';
      } else {
        widthEditCanvasEl.style.width = '';
        widthEditCanvasEl.style.marginLeft = '';
      }
    }

    if (!initial) {
      _segmentsChanged();
    }
  }

  function _moveInfoBubble(segmentEl) {
    var infoBubbleEl = document.querySelector('#info-bubble');

    var infoBubbleWidth = infoBubbleEl.offsetWidth;
    var infoBubbleHeight = infoBubbleEl.offsetHeight;

    var pos = _getElAbsolutePos(segmentEl);

    var left = (pos[0] + segmentEl.offsetWidth / 2) - (infoBubbleWidth / 2);
    var top = pos[1];

    infoBubbleEl.style.left = left + 'px';
    infoBubbleEl.style.height = infoBubbleHeight + 'px';
    // TODO const
    infoBubbleEl.style.top = (top + 510 - infoBubbleHeight) + 'px';

    var segment = street.segments[parseInt(segmentEl.dataNo)];

    var html = '';
    html += '<button class="close">×</button>';

    html += '<h1>' + SEGMENT_INFO[segmentEl.getAttribute('type')].name + '</h1>';
    html += '<section class="content">';
    if (segment.warnings[SEGMENT_WARNING_OUTSIDE]) {
      html += '<p class="warning">';
      html += '<strong>This segment doesn’t fit within the street.</strong> ';
      html += 'Resize the segment or remove other segments.';
      html += '</p>';
    }
    if (segment.warnings[SEGMENT_WARNING_WIDTH_TOO_SMALL]) {
      html += '<p class="warning">';
      html += '<strong>This segment is not wide enough.</strong> ';
      html += 'Drive lanes under 8" lorem ipsum.';
      html += '</p>';
    }
    if (segment.warnings[SEGMENT_WARNING_WIDTH_TOO_LARGE]) {
      html += '<p class="warning">';
      html += '<strong>This segment is too wide.</strong> ';
      html += 'Drive lanes over 15" lorem ipsum.';
      html += '</p>';
    }
    html += '<p class="photo"><img src="/images/info-bubble-examples/bike-lane.jpg"></p>';
    html += '<p class="description">Etizzle sizzle urna ut nisl. Tellivizzle quizzle arcu. Own yo’ pulvinar, ipsizzle shut the shizzle up bizzle we gonna chung, nulla purizzle izzle brizzle, shizzle my nizzle crocodizzle nizzle metus nulla izzle izzle. Vivamus ullamcorpizzle, tortor et varizzle owned, mah nizzle black break yo neck, yall crackalackin, izzle shiz leo elizzle fizzle dolizzle. Maurizzle aliquet, orci vel mah nizzle yippiyo, sizzle cool luctus fizzle, izzle bibendizzle enizzle dizzle yippiyo nisl. Nullizzle phat velizzle shiznit get down get down eleifend dawg. Phasellizzle nec nibh. Curabitizzle nizzle velit boom shackalack uhuh ... yih! sodalizzle facilisizzle. Maecenas things nulla, iaculizzle check it out, pot sed, rizzle a, erizzle. Nulla vitae turpis fo shizzle my nizzle nibh get down get down nizzle. Nizzle pulvinar consectetizzle velizzle. Aliquizzle mofo volutpizzle. Nunc ut leo izzle shit get down get down faucibus. Crizzle nizzle lacizzle the bizzle shizznit condimentizzle ultricies. Ut nisl. Fo shizzle my nizzle izzle fo shizzle mah nizzle fo rizzle, mah home g-dizzle. Integer laorizzle nizzle away mi. Crunk at turpizzle.</p>';
    html += '</section>';

    infoBubbleEl.innerHTML = html;

    infoBubbleEl.querySelector('.close').addEventListener('click', _hideInfoBubble);

    var el = document.querySelector('.segment.hover');
    if (el) {
      el.classList.remove('hover');
    }

    segmentEl.classList.add('hover');
  }

  function _hideInfoBubble() {
    var el = document.querySelector('.segment.hover');
    if (el) {
      el.classList.remove('hover');
    }

    var infoBubbleEl = document.querySelector('#info-bubble');
    infoBubbleEl.classList.remove('visible');
    infoBubbleVisible = false;

    document.body.classList.remove('info-bubble-visible');
  }

  function _onInfoButtonMouseOver(event) {
    if (!infoBubbleVisible) {
      return;
    }

    var el = event.target;
    var segmentEl = el.segmentEl;

    window.clearTimeout(infoButtonHoverTimerId);

    // TODO const
    infoButtonHoverTimerId = 
        window.setTimeout(function() { _showInfoBubble(segmentEl); }, 250);
  }

  function _onInfoButtonMouseOut(event) {
    window.clearTimeout(infoButtonHoverTimerId);    
  }

  function _showInfoBubble(segmentEl) {
    window.clearTimeout(infoButtonHoverTimerId);

    if (!infoBubbleVisible) {
      var infoBubbleEl = document.querySelector('#info-bubble');
      infoBubbleEl.classList.add('visible');
      infoBubbleEl.classList.add('no-move-transition');
      infoBubbleVisible = true;
      document.body.classList.add('info-bubble-visible');
    }

    _moveInfoBubble(segmentEl);

    window.setTimeout(function() {
      infoBubbleEl.classList.remove('no-move-transition');
    }, 0);
  }

  function _onInfoButtonClick(event) {
    window.clearTimeout(infoButtonHoverTimerId);

    if (infoBubbleVisible) {
      _hideInfoBubble();
    } else {
      var el = event.target;
      var segmentEl = el.segmentEl;

      _showInfoBubble(segmentEl);
    }
  }

  function _getVariantString(variant) {
    var string = '';
    for (var i in variant) {
      string += variant[i] + VARIANT_SEPARATOR;
    }

    string = string.substr(0, string.length - 1);
    return string;
  }

  function _createSegment(type, variantString, width, isUnmovable, palette) {
    var el = document.createElement('div');
    el.classList.add('segment');
    el.setAttribute('type', type);
    el.setAttribute('variant-string', variantString);

    if (isUnmovable) {
      el.classList.add('unmovable');
    }
    
    _setSegmentContents(el, type, variantString, width, palette);

    if (!palette) {
      el.style.zIndex = SEGMENT_INFO[type].zIndex;

      var innerEl = document.createElement('span');
      innerEl.classList.add('name');
      innerEl.innerHTML = SEGMENT_INFO[type].name;
      el.appendChild(innerEl);

      var innerEl = document.createElement('span');
      innerEl.classList.add('width');
      el.appendChild(innerEl);

      var dragHandleEl = document.createElement('span');
      dragHandleEl.classList.add('drag-handle');
      dragHandleEl.classList.add('left');
      dragHandleEl.segmentEl = el;
      dragHandleEl.innerHTML = '‹';
      el.appendChild(dragHandleEl);

      var dragHandleEl = document.createElement('span');
      dragHandleEl.classList.add('drag-handle');
      dragHandleEl.classList.add('right');
      dragHandleEl.segmentEl = el;
      dragHandleEl.innerHTML = '›';
      el.appendChild(dragHandleEl);

      var commandsEl = document.createElement('span');
      commandsEl.classList.add('commands');

      var innerEl = document.createElement('button');
      innerEl.classList.add('remove');
      innerEl.innerHTML = '×';
      innerEl.segmentEl = el;
      innerEl.tabIndex = -1;
      innerEl.setAttribute('title', msg('TOOLTIP_REMOVE_SEGMENT'));
      if (system.touch) {      
        innerEl.addEventListener('touchstart', _onRemoveButtonClick);
      } else {
        innerEl.addEventListener('click', _onRemoveButtonClick);        
      }
      commandsEl.appendChild(innerEl);        

      /*var innerEl = document.createElement('button');
      innerEl.classList.add('info');
      innerEl.segmentEl = el;
      innerEl.tabIndex = -1;
      innerEl.addEventListener('mouseover', _onInfoButtonMouseOver);
      innerEl.addEventListener('mouseout', _onInfoButtonMouseOut);
      innerEl.addEventListener('click', _onInfoButtonClick);
      commandsEl.appendChild(innerEl); */

      el.appendChild(commandsEl);

      var widthEditCanvasEl = document.createElement('span');
      widthEditCanvasEl.classList.add('width-edit-canvas');

      var innerEl = document.createElement('button');
      innerEl.classList.add('decrement');
      innerEl.innerHTML = '–';
      innerEl.segmentEl = el;
      innerEl.tabIndex = -1;
      if (system.touch) {
        innerEl.addEventListener('touchstart', _onWidthDecrementClick);
      } else {
        innerEl.addEventListener('click', _onWidthDecrementClick);        
      }
      widthEditCanvasEl.appendChild(innerEl);        

      if (!system.touch) {
        var innerEl = document.createElement('input');
        innerEl.setAttribute('type', 'text');
        innerEl.classList.add('width-edit');
        innerEl.segmentEl = el;
        //innerEl.value = width / TILE_SIZE;

        innerEl.addEventListener('click', _onWidthEditClick);
        innerEl.addEventListener('focus', _onWidthEditFocus);
        innerEl.addEventListener('blur', _onWidthEditBlur);
        innerEl.addEventListener('input', _onWidthEditInput);
        innerEl.addEventListener('mouseover', _onWidthEditMouseOver);
        innerEl.addEventListener('mouseout', _onWidthEditMouseOut);
        innerEl.addEventListener('keydown', _onWidthEditKeyDown);
      } else {
        var innerEl = document.createElement('span');
        innerEl.classList.add('width-edit-placeholder');
      }
      widthEditCanvasEl.appendChild(innerEl);

      var innerEl = document.createElement('button');
      innerEl.classList.add('increment');
      innerEl.innerHTML = '+';
      innerEl.segmentEl = el;
      innerEl.tabIndex = -1;
      if (system.touch) {
        innerEl.addEventListener('touchstart', _onWidthIncrementClick);
      } else {
        innerEl.addEventListener('click', _onWidthIncrementClick);        
      }
      widthEditCanvasEl.appendChild(innerEl);        

      el.appendChild(widthEditCanvasEl);

      var innerEl = document.createElement('span');
      innerEl.classList.add('grid');
      el.appendChild(innerEl);
    } else {
    	el.setAttribute('title', SEGMENT_INFO[type].name);
    }

    if (width) {
      _resizeSegment(el, RESIZE_TYPE_INITIAL, width, true, palette, true, true);
    }    
    return el;
  }

  function _createSegmentDom(segment) {
    return _createSegment(segment.type, segment.variantString, 
        segment.width * TILE_SIZE, segment.unmovable);
  }  

  function _createDomFromData() {
    document.querySelector('#editable-street-section').innerHTML = '';

    for (var i in street.segments) {
      var segment = street.segments[i];

      var el = _createSegmentDom(segment);
      document.querySelector('#editable-street-section').appendChild(el);

      segment.el = el;
      segment.el.dataNo = i;
    }

    _repositionSegments();
  }

  function _repositionSegments() {
    var left = 0;

    for (var i in street.segments) {
      var el = street.segments[i].el;

      if (el == draggingMove.segmentBeforeEl) {
        left += DRAGGING_MOVE_HOLE_WIDTH;

        if (!draggingMove.segmentAfterEl) {
          left += DRAGGING_MOVE_HOLE_WIDTH;
        }
      }

      if (el.classList.contains('dragged-out')) {
        var width = 0;
      } else {
        var width = parseFloat(el.getAttribute('width')) * TILE_SIZE;
      }

      el.savedLeft = parseInt(left); // so we don’t have to use offsetLeft
      el.savedWidth = parseInt(width);

      left += width;

      if (el == draggingMove.segmentAfterEl) {
        left += DRAGGING_MOVE_HOLE_WIDTH;

        if (!draggingMove.segmentBeforeEl) {
          left += DRAGGING_MOVE_HOLE_WIDTH;
        }
      }
    }

    var occupiedWidth = left;

    var mainLeft = Math.round((street.width * TILE_SIZE - occupiedWidth) / 2);

    for (var i in street.segments) {
      var el = street.segments[i].el;

      el.savedLeft += mainLeft;

      if (system.cssTransform) {
        el.style[system.cssTransform] = 'translateX(' + el.savedLeft + 'px)';
        el.cssTransformLeft = el.savedLeft;
      } else {
        el.style.left = el.savedLeft + 'px';
      }
    }
  }

  function _applyWarningsToSegments() {
    for (var i in street.segments) {
      var segment = street.segments[i];

      if (segment.el) {
        if (segment.warnings[SEGMENT_WARNING_OUTSIDE] || 
            segment.warnings[SEGMENT_WARNING_WIDTH_TOO_SMALL] ||
            segment.warnings[SEGMENT_WARNING_WIDTH_TOO_LARGE]) {
          segment.el.classList.add('warning');          
        } else {
          segment.el.classList.remove('warning');                    
        }

        if (segment.warnings[SEGMENT_WARNING_OUTSIDE]) {
          segment.el.classList.add('outside');
        } else {
          segment.el.classList.remove('outside');
        }
      }
    }
  }

  function _recalculateWidth() {
    street.occupiedWidth = 0;

    for (var i in street.segments) {
      var segment = street.segments[i];

      street.occupiedWidth += segment.width;
    }   

    street.remainingWidth = street.width - street.occupiedWidth;
    // Rounding problems :·(
    if (Math.abs(street.remainingWidth) < WIDTH_ROUNDING) {
      street.remainingWidth = 0;
    }

    var position = street.width / 2 - street.occupiedWidth / 2;

    for (var i in street.segments) {
      var segment = street.segments[i];
      var segmentInfo = SEGMENT_INFO[segment.type];
      var variantInfo = SEGMENT_INFO[segment.type].details[segment.variantString];

      if (segment.el) {
        if ((street.remainingWidth < 0) && 
            ((position < 0) || ((position + segment.width) > street.width))) {
          segment.warnings[SEGMENT_WARNING_OUTSIDE] = true;
        } else {
          segment.warnings[SEGMENT_WARNING_OUTSIDE] = false;
        }

        if (variantInfo.minWidth && (segment.width < variantInfo.minWidth)) {
          segment.warnings[SEGMENT_WARNING_WIDTH_TOO_SMALL] = true;
        } else {
          segment.warnings[SEGMENT_WARNING_WIDTH_TOO_SMALL] = false;          
        }

        if (variantInfo.maxWidth && (segment.width > variantInfo.maxWidth)) {
          segment.warnings[SEGMENT_WARNING_WIDTH_TOO_LARGE] = true;
        } else {
          segment.warnings[SEGMENT_WARNING_WIDTH_TOO_LARGE] = false;          
        }
      }

      position += street.segments[i].width;
    }

    if (street.remainingWidth >= 0) {
      document.body.classList.remove('street-overflows');
    } else {
      document.body.classList.add('street-overflows');
    }

    _applyWarningsToSegments();
  }

  function _segmentsChanged() {
    if (!initializing) {
      _createDataFromDom();
    }

    _recalculateWidth();
    _recalculateOwnerWidths();

    for (var i in street.segments) {
      if (street.segments[i].el) {
        street.segments[i].el.dataNo = i;
      }
    }

    _saveStreetToServerIfNecessary();
    _updateUndoButtons();
    _repositionSegments();
  }

  function _updateEverything() {
    ignoreStreetChanges = true;
    _propagateUnits();
    _buildStreetWidthMenu();
    _updateShareMenu();
    _createDomFromData();
    _segmentsChanged();
    _resizeStreetWidth();
    _updateStreetName();
    ignoreStreetChanges = false;
    _updateUndoButtons();
    lastStreet = _trimStreetData(street);

    _scheduleSavingStreetToServer();
  }

  function _undoRedo(undo) {
    if (undo && !_isUndoAvailable()) {
      _statusMessage.show(msg('STATUS_NOTHING_TO_UNDO'));
    } else if (!undo && !_isRedoAvailable()) {
      _statusMessage.show(msg('STATUS_NOTHING_TO_REDO'));
    } else {
      if (undo) {
        undoStack[undoPosition] = _trimStreetData(street);
        undoPosition--;
      } else {
        undoPosition++;
      }
      street = _clone(undoStack[undoPosition]);
      _setUpdateTimeToNow();

      _updateEverything();
      _statusMessage.hide();
    }
  }

  function _clearUndoStack() {
    undoStack = [];
    undoPosition = 0;
    _updateUndoButtons();
  }

  function _undo() {
    _undoRedo(true);
  }

  function _redo() {
    _undoRedo(false);
  }

  function _trimUndoStack() {
    // TODO optimize
    while (undoPosition >= UNDO_LIMIT) {
      undoPosition--;
      undoStack = undoStack.slice(1);
    }
  }

  function _createNewUndo() {
    // This removes future undo path in case we undo a few times and then do
    // something undoable.
    undoStack = undoStack.splice(0, undoPosition);
    undoStack[undoPosition] = _clone(lastStreet);
    undoPosition++;

    _trimUndoStack();
  }

  function _createNewUndoIfNecessary(lastStreet, currentStreet) {
    if (lastStreet.name != currentStreet.name) {
      return;
    }

    _createNewUndo();
  }

  function _unpackStreetDataFromServerTransmission(transmission) {
    var street = _clone(transmission.data.street);

    street.creatorId = (transmission.creator && transmission.creator.id) || null;
    street.originalStreetId = transmission.originalStreetId || null;
    street.updatedAt = transmission.updatedAt || null;
    street.name = transmission.name || DEFAULT_NAME;

    return street;
  }

  function _unpackServerStreetData(transmission, id, namespacedId) {
    //console.log('unpack server street data', transmission);

    street = _unpackStreetDataFromServerTransmission(transmission);

    undoStack = _clone(transmission.data.undoStack);
    undoPosition = transmission.data.undoPosition;

    if (id) {
      _setStreetId(id, namespacedId);
    } else {
      _setStreetId(transmission.id, transmission.namespacedId);
    }
  }

  function _packServerStreetData() {
    var data = {};

    data.street = _trimStreetData(street);

    // Those go above data in the structure, so they need to be cleared here
    delete data.street.name;
    delete data.street.originalStreetId;
    delete data.street.updatedAt;

    // This will be implied through authorization header
    delete data.street.creatorId;

    data.undoStack = _clone(undoStack);
    data.undoPosition = undoPosition;

    var transmission = {
      name: street.name,
      originalStreetId: street.originalStreetId,
      data: data
    }

    //console.log(transmission);

    return JSON.stringify(transmission);
  }

  function _getNonblockingAjaxRequestCount() {
    return nonblockingAjaxRequests.length;
  }

/*  function _debugOutput() {
    console.log('-');
    console.log(_getNonblockingAjaxRequestCount() + ' requests…');

    for (var i in nonblockingAjaxRequests) {
      console.log('    …' + _getAjaxRequestSignature(nonblockingAjaxRequests[i].request));
    }
  }*/

  function _getAjaxRequestSignature(request) {
    return request.type + ' ' + request.url;
  }

  function _newNonblockingAjaxRequest(request, allowToClosePage, doneFunc, errorFunc) {
    nonblockingAjaxRequestTimer = 0;

    //console.log('new request added…');
    var signature = _getAjaxRequestSignature(request);

    /*if (!nonblockingAjaxRequests[signature]) {
      nonblockingAjaxRequestCount++;
    }*/
    _removeNonblockingAjaxRequest(signature);
    nonblockingAjaxRequests.push( 
      { request: request, allowToClosePage: allowToClosePage, 
        doneFunc: doneFunc, errorFunc: errorFunc,
        signature: signature }
    );

    //_debugOutput();

    _scheduleNextNonblockingAjaxRequest();
  }

  function _nonblockingAjaxTryAgain() {
    _noConnectionMessage.hide();

    nonblockingAjaxRequestTimer = 0;

    _scheduleNextNonblockingAjaxRequest();
  }

  function _sendNextNonblockingAjaxRequest() {
    if (abortEverything) {
      return;
    }

    //console.log('send next…');

    if (_getNonblockingAjaxRequestCount()) {
      _noConnectionMessage.schedule();        

      var request = null;

      request = nonblockingAjaxRequests[0];

      if (request) {
        //console.log('sending…');

        var query = jQuery.ajax(request.request).done(function(data) {
          _successNonblockingAjaxRequest(data, request);
        }).fail(function(data) {
          _errorNonblockingAjaxRequest(data, request);
        });
      }
      
      _scheduleNextNonblockingAjaxRequest();
    }
  }

  function _tempFail(error) {
    console.log('FAIL!!!', error);
  }

  function _scheduleNextNonblockingAjaxRequest() {
    //console.log('schedule next…');

    if (_getNonblockingAjaxRequestCount()) {
      if (nonblockingAjaxRequestTimer < NON_BLOCKING_AJAX_REQUEST_TIME.length) {
        var time = NON_BLOCKING_AJAX_REQUEST_TIME[nonblockingAjaxRequestTimer];
      } else {
        var time = Math.floor(Math.random() * NON_BLOCKING_AJAX_REQUEST_BACKOFF_RANGE);
      }

      //console.log('schedule next… at time: ', time);

      window.setTimeout(_sendNextNonblockingAjaxRequest, time);

      nonblockingAjaxRequestTimer++;
    } else {
      //console.log('nothing more to send!');

      saveStreetIncomplete = false;
    }
  }

  function _removeNonblockingAjaxRequest(signature) {
    for (var i in nonblockingAjaxRequests) {
      if (nonblockingAjaxRequests[i].signature == signature) {
        nonblockingAjaxRequests.splice(i, 1);
        //console.log('removed');
        break;
      }
    }    
  }

  function _errorNonblockingAjaxRequest(data, request) {
    if (request.errorFunc) {
      request.errorFunc(data);
    }    
  }

  function _successNonblockingAjaxRequest(data, request) {
    nonblockingAjaxRequestTimer = 0;
    //nonblockingAjaxRequestCount--;

    //var signature = request.request);

    _noConnectionMessage.hide();

    //console.log('signature', signature);
    //delete nonblockingAjaxRequests[signature];
    //console.log('after deleting', nonblockingAjaxRequests[signature]);
    //console.log(data, textStatus, jqXHR);

    //console.log('trying to remove');
    _removeNonblockingAjaxRequest(request.signature);
    /*for (var i in nonblockingAjaxRequests) {
      if (nonblockingAjaxRequests[i].signature == request.signature) {
        nonblockingAjaxRequests.splice(i, 1);
        console.log('removed');
      }
    }*/

    //console.log('SUCCESS!', request.signature);
    //_debugOutput();

    if (request.doneFunc) {
      request.doneFunc(data);
    }

    _scheduleNextNonblockingAjaxRequest();
  }

  function _saveStreetToServer(initial) {
    //console.log('save street to server…');

    var transmission = _packServerStreetData();

    if (initial) {
      // blocking

      jQuery.ajax({
        // TODO const
        url: system.apiUrl + 'v1/streets/' + street.id,
        data: transmission,
        dataType: 'json',
        type: 'PUT',
        contentType: 'application/json',
        headers: { 'Authorization': _getAuthHeader() }
      }).done(_confirmSaveStreetToServerInitial);
    } else {
      //console.log('output', transmission);

      _newNonblockingAjaxRequest({
        // TODO const
        url: system.apiUrl + 'v1/streets/' + street.id,
        data: transmission,
        dataType: 'json',
        type: 'PUT',
        contentType: 'application/json',
        headers: { 'Authorization': _getAuthHeader() }
      }, false);
    }
  }

  function _confirmSaveStreetToServerInitial() {
    saveStreetIncomplete = false;

    serverContacted = true;
    _checkIfEverythingIsLoaded();
  }


  function _saveSettingsToServer() {
    if (!signedIn || abortEverything) {
      return;
    }

    var transmission = JSON.stringify({ data: _trimSettings() });

    _newNonblockingAjaxRequest({
      // TODO const
      url: system.apiUrl + 'v1/users/' + signInData.userId,
      data: transmission,
      dataType: 'json',
      type: 'PUT',
      contentType: 'application/json',
      headers: { 'Authorization': _getAuthHeader() }
    }, true, null, _errorSavingSettingsToServer);

//      function _newNonblockingAjaxRequest(request, allowToClosePage, doneFunc, errorFunc) {
  }

  function _errorSavingSettingsToServer(data) {
    if (!abortEverything && (data.status == 401)) {
      mode = MODE_FORCE_RELOAD_SIGN_OUT_401;
      _processMode();
    }
    //alert(data.status);
  }

  function _clearScheduledSavingStreetToServer() {
    window.clearTimeout(saveStreetTimerId);
  }

  function _clearScheduledSavingSettingsToServer() {
    window.clearTimeout(saveSettingsTimerId);
  }

  function _successBlockingAjaxRequest(data) {
    _hideBlockingShield();

    blockingAjaxRequestInProgress = false;

    blockingAjaxRequestDoneFunc(data);
  }

  function _errorBlockingAjaxRequest() {
    if (blockingAjaxRequestCancelFunc) {
      document.querySelector('#blocking-shield').classList.add('show-cancel');      
    }

    document.querySelector('#blocking-shield').classList.add('show-try-again');

    _darkenBlockingShield();
  }

  function _blockingTryAgain() {
    document.querySelector('#blocking-shield').classList.remove('show-try-again');
    document.querySelector('#blocking-shield').classList.remove('show-cancel');

    jQuery.ajax(blockingAjaxRequest).
        done(_successBlockingAjaxRequest).fail(_errorBlockingAjaxRequest);
  }

  function _blockingCancel() {
    _hideBlockingShield();

    blockingAjaxRequestInProgress = false;

    blockingAjaxRequestCancelFunc();
  }

  function _newBlockingAjaxRequest(message, request, doneFunc, cancelFunc) {
    _showBlockingShield(message);

    blockingAjaxRequestInProgress = true;

    blockingAjaxRequest = request;
    blockingAjaxRequestDoneFunc = doneFunc;
    blockingAjaxRequestCancelFunc = cancelFunc;

    jQuery.ajax(blockingAjaxRequest).
        done(_successBlockingAjaxRequest).fail(_errorBlockingAjaxRequest);
  }

  function _remixStreet() {
    remixOnFirstEdit = false;

    if (signedIn) {
      _setStreetCreatorId(signInData.userId);
    } else {
      _setStreetCreatorId(null);
    }

    street.originalStreetId = street.id;

    _unifyUndoStack();

    if (undoStack[undoPosition - 1] && (undoStack[undoPosition - 1].name != street.name)) {
      // The street was remixed as a result of editing its name. Don’t be
      // a douche and add (remixed) to it then.
      var dontAddSuffix = true;
    } else {
      var dontAddSuffix = false;
    }

    if (!promoteStreet && !dontAddSuffix) {
      _addRemixSuffixToName();
    }

    var transmission = _packServerStreetData();

    //console.log('Z');
    _newBlockingAjaxRequest('Remixing…', 
        {
          // TODO const
          url: system.apiUrl + 'v1/streets',
          type: 'POST',
          data: transmission,
          dataType: 'json',
          contentType: 'application/json',
          headers: { 'Authorization': _getAuthHeader() }
        }, _receiveRemixedStreet
    );
  }

  function _updateLastStreetInfo() {
    //console.log('update');

    settings.lastStreetId = street.id;
    settings.lastStreetNamespacedId = street.namespacedId;
    settings.lastStreetCreatorId = street.creatorId;

    _saveSettingsLocally();
  }

  function _unifyUndoStack() {
    for (var i in undoStack) {
      undoStack[i].id = street.id;
      undoStack[i].name = street.name;
      undoStack[i].namespacedId = street.namespacedId;
      undoStack[i].creatorId = street.creatorId;
      undoStack[i].updatedAt = street.updatedAt; 
    }
  }

  function _setStreetId(newId, newNamespacedId) {
    street.id = newId;
    street.namespacedId = newNamespacedId;

    _unifyUndoStack();

    _updateLastStreetInfo();
  }

  function _setStreetCreatorId(newId) {
    street.creatorId = newId;

    _unifyUndoStack();
    _updateLastStreetInfo();
  }

  function _addRemixSuffixToName() {
    // Removed for the time being to see if we like it without this.
    return;

    if (street.name.substr(street.name.length - STREET_NAME_REMIX_SUFFIX.length, 
        STREET_NAME_REMIX_SUFFIX.length) != STREET_NAME_REMIX_SUFFIX) {
      street.name += ' ' + STREET_NAME_REMIX_SUFFIX;
    }
  }

  function _receiveRemixedStreet(data) {
    if (!promoteStreet) {
      if (signedIn) {
        _statusMessage.show(msg('STATUS_NOW_REMIXING'));
      } else {
        _statusMessage.show(msg('STATUS_NOW_REMIXING_SIGN_IN', { signInUrl: URL_SIGN_IN_REDIRECT }));
      }
    }

    _setStreetId(data.id, data.namespacedId);
    _updateStreetName();

    _saveStreetToServer(false);
  }

  function _scheduleSavingStreetToServer() {
    //console.log('schedule save…');

    saveStreetIncomplete = true;

    _clearScheduledSavingStreetToServer();

    if (remixOnFirstEdit) {
      _remixStreet();
    } else {
      saveStreetTimerId = 
          window.setTimeout(function() { _saveStreetToServer(false); }, SAVE_STREET_DELAY);
    }
  }

  function _scheduleSavingSettingsToServer() {
    if (!signedIn) {
      return;
    }

    _clearScheduledSavingSettingsToServer();

    saveSettingsTimerId = 
        window.setTimeout(function() { _saveSettingsToServer(); }, SAVE_SETTINGS_DELAY);
  }

  function _setUpdateTimeToNow() {
    //console.log('SET TO NOW');

    street.updatedAt = new Date().getTime();
    _unifyUndoStack();
    _updateStreetAttribution();
  }

  function _saveStreetToServerIfNecessary() {
    if (ignoreStreetChanges || abortEverything) {
      return;
    }

    var currentData = _trimStreetData(street);

    if (JSON.stringify(currentData) != JSON.stringify(lastStreet)) {
      _setUpdateTimeToNow();
      _hideNewStreetMenu();

      // As per issue #306.
      _statusMessage.hide();

      _hideStreetAttribution();

      _createNewUndoIfNecessary(lastStreet, currentData);
      _scheduleSavingStreetToServer();

      lastStreet = currentData;

      _updateUndoButtons();
    }
  }

  function _checkIfChangesSaved() {
    // don’t do for settings deliberately

    if (abortEverything) {
      return null;
    }

    var showWarning = false;

    if (saveStreetIncomplete) {
      showWarning = true;
    } else for (var i in nonblockingAjaxRequests) {
      if (!nonblockingAjaxRequests[i].allowToClosePage) {
        showWarning = true;
      }
    }

    if (showWarning) {
      nonblockingAjaxRequestTimer = 0;
      _scheduleNextNonblockingAjaxRequest();

      return 'Your changes have not been saved yet. Please return to the page, check your Internet connection, and wait a little while to allow the changes to be saved.';
    } else {
      return null;
    }
  }

  function _onWindowBeforeUnload() {
    return _checkIfChangesSaved();
  }

  function _getVariantArray(segment, variantString) {
    var variantArray = {};
    var variantSplit = variantString.split(VARIANT_SEPARATOR);

    for (var i in SEGMENT_INFO[segment.type].variants) {
      var variantName = SEGMENT_INFO[segment.type].variants[i];

      variantArray[variantName] = variantSplit[i];
    }

    return variantArray;
  }

  // Copies only the data necessary for save/undo.
  function _trimStreetData(street) {
    var newData = {};

    newData.width = street.width;
    newData.name = street.name;

    newData.id = street.id;
    newData.namespacedId = street.namespacedId;
    newData.creatorId = street.creatorId;
    newData.originalStreetId = street.originalStreetId;
    newData.units = street.units;

    newData.segments = [];

    for (var i in street.segments) {
      var segment = {};
      segment.type = street.segments[i].type;
      segment.variantString = street.segments[i].variantString;
      segment.width = street.segments[i].width;

      newData.segments.push(segment);
    }

    return newData;
  }  

  // TODO this function should not exist; all the data should be in street. 
  // object to begin with
  function _createDataFromDom() {
    var els = document.querySelectorAll('#editable-street-section > .segment');

    street.segments = [];

    for (var i = 0, el; el = els[i]; i++) {
      var segment = {};
      segment.type = el.getAttribute('type');
      segment.variantString = el.getAttribute('variant-string');
      segment.variant = _getVariantArray(segment, segment.variantString);
      segment.width = parseFloat(el.getAttribute('width'));
      segment.el = el;
      segment.warnings = [];
      street.segments.push(segment);
    }
  }

  function _drawLine(ctx, x1, y1, x2, y2) {
    x1 *= system.hiDpi;
    y1 *= system.hiDpi;
    x2 *= system.hiDpi;
    y2 *= system.hiDpi;

    ctx.beginPath(); 
    ctx.moveTo(x1, y1); 
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function _drawArrowLine(ctx, x1, y1, x2, y2, text) {
    x1 += 2;
    x2 -= 2;

    _drawLine(ctx, x1, y1, x2, y2);

    if (text) {
      ctx.font = (12 * system.hiDpi) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(text, (x1 + x2) / 2 * system.hiDpi, y1 * system.hiDpi - 10);      
    }
  }

  function _updateWidthChart(ownerWidths) {
    var ctx = document.querySelector('#width-chart').getContext('2d');

    var chartWidth = WIDTH_CHART_WIDTH;
    var canvasWidth = document.querySelector('#width-chart').offsetWidth;
    var canvasHeight = document.querySelector('#width-chart').offsetHeight;

    document.querySelector('#width-chart').width = canvasWidth * system.hiDpi;
    document.querySelector('#width-chart').height = canvasHeight * system.hiDpi;

    chartWidth -= WIDTH_CHART_MARGIN * 2;

    var left = (canvasWidth - chartWidth) / 2;

    for (var id in SEGMENT_OWNERS) {
      if (ownerWidths[id] == 0) {
        chartWidth -= WIDTH_CHART_EMPTY_OWNER_WIDTH;
      }
    }

    var maxWidth = street.width;
    if (street.occupiedWidth > street.width) {
      maxWidth = street.occupiedWidth;
    }

    var multiplier = chartWidth / maxWidth;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    var bottom = 70;

    _drawLine(ctx, left, 20, left, bottom);
    if (maxWidth > street.width) {
      _drawLine(ctx, left + street.width * multiplier, 20, 
          left + street.width * multiplier, 40);

      ctx.save();
      // TODO const
      ctx.strokeStyle = 'red';
      ctx.fillStyle = 'red';
      _drawArrowLine(ctx, 
        left + street.width * multiplier, 30, 
        left + maxWidth * multiplier, 30, 
        _prettifyWidth(-street.remainingWidth, PRETTIFY_WIDTH_OUTPUT_NO_MARKUP));
      ctx.restore();
    }

    _drawLine(ctx, left + maxWidth * multiplier, 20, 
        left + maxWidth * multiplier, bottom);
    _drawArrowLine(ctx, 
        left, 30, left + street.width * multiplier, 30);
  
    var x = left;

    for (var id in SEGMENT_OWNERS) {
      if (ownerWidths[id] > 0) {
        var width = ownerWidths[id] * multiplier;

        _drawArrowLine(ctx, x, 60, x + width, 60, 
            _prettifyWidth(ownerWidths[id], PRETTIFY_WIDTH_OUTPUT_NO_MARKUP));
        _drawLine(ctx, x + width, 50, x + width, 70);

        var imageWidth = images[SEGMENT_OWNERS[id].imageUrl].width / 5 * SEGMENT_OWNERS[id].imageSize;
        var imageHeight = images[SEGMENT_OWNERS[id].imageUrl].height / 5 * SEGMENT_OWNERS[id].imageSize;

        ctx.drawImage(images[SEGMENT_OWNERS[id].imageUrl], 
            0, 
            0, 
            images[SEGMENT_OWNERS[id].imageUrl].width, 
            images[SEGMENT_OWNERS[id].imageUrl].height, 
            (x + width / 2 - imageWidth / 2) * system.hiDpi, 
            (80 - imageHeight) * system.hiDpi,
            imageWidth * system.hiDpi, 
            imageHeight * system.hiDpi);

        x += width;
      }
    }

    if (street.remainingWidth > 0) {
      ctx.save();
      // TODO const
      ctx.strokeStyle = 'rgb(100, 100, 100)';
      ctx.fillStyle = 'rgb(100, 100, 100)';
      if (ctx.setLineDash) {
        ctx.setLineDash([15, 10]);
      }
      _drawArrowLine(ctx, x, 60, left + street.width * multiplier, 60, _prettifyWidth(street.remainingWidth, PRETTIFY_WIDTH_OUTPUT_NO_MARKUP));
      ctx.restore();
    }

    x = left + maxWidth * multiplier;

    for (var id in SEGMENT_OWNERS) {
      if (ownerWidths[id] == 0) {
        var width = WIDTH_CHART_EMPTY_OWNER_WIDTH;

        ctx.fillStyle = 'rgb(100, 100, 100)';
        ctx.strokeStyle = 'rgb(100, 100, 100)';

        _drawArrowLine(ctx, x, 60, x + width, 60, '–');
        _drawLine(ctx, x + width, 50, x + width, 70);

        var imageWidth = images[SEGMENT_OWNERS[id].imageUrl].width / 5 * SEGMENT_OWNERS[id].imageSize;
        var imageHeight = images[SEGMENT_OWNERS[id].imageUrl].height / 5 * SEGMENT_OWNERS[id].imageSize;

        ctx.save();
        ctx.globalAlpha = .5;
        ctx.drawImage(images[SEGMENT_OWNERS[id].imageUrl], 
            0, 
            0, 
            images[SEGMENT_OWNERS[id].imageUrl].width, 
            images[SEGMENT_OWNERS[id].imageUrl].height, 
            (x + width / 2 - imageWidth / 2) * system.hiDpi, 
            (80 - imageHeight) * system.hiDpi,
            imageWidth * system.hiDpi, 
            imageHeight * system.hiDpi);
        ctx.restore();
        
        x += width;
      }
    }

    document.querySelector('#street-width-canvas').style.left = 
        WIDTH_CHART_MARGIN + 'px';
    document.querySelector('#street-width-canvas').style.width = 
        (street.width * multiplier) + 'px';
  }

  function _recalculateOwnerWidths() {
    var ownerWidths = {};

    for (var id in SEGMENT_OWNERS) {
      ownerWidths[id] = 0;
    }

    for (var i in street.segments) {
      var segment = street.segments[i];

      ownerWidths[SEGMENT_INFO[segment.type].owner] += segment.width;
    }   

    _updateWidthChart(ownerWidths);
  }

  function _changeDraggingType(newDraggingType) {
    draggingType = newDraggingType;

    document.body.classList.remove('segment-move-dragging');
    document.body.classList.remove('segment-resize-dragging');

    switch (draggingType) {
      case DRAGGING_TYPE_RESIZE:
        document.body.classList.add('segment-resize-dragging');
        break;
      case DRAGGING_TYPE_MOVE:
        document.body.classList.add('segment-move-dragging');
        break;
    }
  }

  function _handleSegmentResizeStart(event) {
    ignoreStreetChanges = true;

    var el = event.target;

    _changeDraggingType(DRAGGING_TYPE_RESIZE);

    var pos = _getElAbsolutePos(el);

    draggingResize.right = el.classList.contains('right');

    draggingResize.floatingEl = document.createElement('div');
    draggingResize.floatingEl.classList.add('drag-handle');
    draggingResize.floatingEl.classList.add('floating');

    draggingResize.floatingEl.style.left = pos[0] + 'px';
    draggingResize.floatingEl.style.top = pos[1] + 'px';
    document.body.appendChild(draggingResize.floatingEl);

    draggingResize.mouseX = event.pageX;
    draggingResize.mouseY = event.pageY;

    draggingResize.elX = pos[0];
    draggingResize.elY = pos[1];

    draggingResize.originalX = draggingResize.elX;
    draggingResize.originalWidth = parseFloat(el.segmentEl.getAttribute('width'));
    draggingResize.segmentEl = el.segmentEl;

    draggingResize.segmentEl.classList.add('hover');

    var segmentInfo = SEGMENT_INFO[el.segmentEl.getAttribute('type')];
    var variantInfo = SEGMENT_INFO[el.segmentEl.getAttribute('type')].details[el.segmentEl.getAttribute('variant-string')];

    if (variantInfo.minWidth) {
      var guideEl = document.createElement('div');
      guideEl.classList.add('guide');

      var width = variantInfo.minWidth * TILE_SIZE;
      guideEl.style.width = width + 'px';
      guideEl.style.marginLeft = (-width / 2) + 'px';
      el.segmentEl.appendChild(guideEl);
    }

    var remainingWidth = 
        street.remainingWidth + parseFloat(el.segmentEl.getAttribute('width'));

    if (remainingWidth && 
        (((!variantInfo.minWidth) && (remainingWidth >= MIN_SEGMENT_WIDTH)) || (remainingWidth >= variantInfo.minWidth)) && 
        ((!variantInfo.maxWidth) || (remainingWidth <= variantInfo.maxWidth))) {
      var guideEl = document.createElement('div');
      guideEl.classList.add('guide');

      var width = remainingWidth * TILE_SIZE;
      guideEl.style.width = width + 'px';
      guideEl.style.marginLeft = (-width / 2) + 'px';
      el.segmentEl.appendChild(guideEl);
    } else if (variantInfo.maxWidth) {
      var guideEl = document.createElement('div');
      guideEl.classList.add('guide');

      var width = variantInfo.maxWidth * TILE_SIZE;
      guideEl.style.width = width + 'px';
      guideEl.style.marginLeft = (-width / 2) + 'px';
      el.segmentEl.appendChild(guideEl);
    }
  }

  function _handleSegmentResizeMove(event) {
    var x = event.pageX;
    var y = event.pageY;

    var deltaX = x - draggingResize.mouseX;
    var deltaY = y - draggingResize.mouseY;

    var deltaFromOriginal = draggingResize.elX - draggingResize.originalX;
    if (!draggingResize.right) {
      deltaFromOriginal = -deltaFromOriginal;
    }

    draggingResize.elX += deltaX;
    draggingResize.floatingEl.style.left = draggingResize.elX + 'px';

    var width = draggingResize.originalWidth + deltaFromOriginal / TILE_SIZE * 2;
    var precise = event.shiftKey;

    if (precise) {
      var resizeType = RESIZE_TYPE_PRECISE_DRAGGING;
    } else {
      var resizeType = RESIZE_TYPE_DRAGGING;
    }

    _resizeSegment(draggingResize.segmentEl, resizeType,
        width * TILE_SIZE, true, false, true);

    draggingResize.mouseX = event.pageX;
    draggingResize.mouseY = event.pageY;
  }  

  function _handleSegmentMoveStart(event) {
    ignoreStreetChanges = true;

    if (event.touches && event.touches[0]) {
      var x = event.touches[0].pageX;
      var y = event.touches[0].pageY;
    } else {
      var x = event.pageX;
      var y = event.pageY;
    }    

    var el = event.target;

    _changeDraggingType(DRAGGING_TYPE_MOVE);

    draggingMove.originalEl = el;

    draggingMove.originalType = draggingMove.originalEl.getAttribute('type');
    draggingMove.originalVariantString = 
        draggingMove.originalEl.getAttribute('variant-string');

    if (draggingMove.originalEl.classList.contains('palette')) {
      draggingMove.type = DRAGGING_TYPE_MOVE_CREATE;
      draggingMove.originalWidth = 
          SEGMENT_INFO[draggingMove.originalType].defaultWidth * TILE_SIZE;
    } else {
      draggingMove.type = DRAGGING_TYPE_MOVE_TRANSFER;      
      draggingMove.originalWidth = 
          draggingMove.originalEl.offsetWidth;
    }

    var pos = _getElAbsolutePos(el);

    draggingMove.elX = pos[0];
    draggingMove.elY = pos[1];

    if (draggingMove.type == DRAGGING_TYPE_MOVE_CREATE) {
      draggingMove.elY += DRAG_OFFSET_Y_PALETTE;
      draggingMove.elX -= draggingMove.originalWidth / 3;
    }

    draggingMove.mouseX = x;
    draggingMove.mouseY = y;

    draggingMove.floatingEl = document.createElement('div');
    draggingMove.floatingEl.classList.add('segment');
    draggingMove.floatingEl.classList.add('floating');
    draggingMove.floatingEl.classList.add('first-drag-move');
    draggingMove.floatingEl.setAttribute('type', draggingMove.originalType);
    draggingMove.floatingEl.setAttribute('variant-string', 
        draggingMove.originalVariantString);
    draggingMove.floatingElVisible = false;
    _setSegmentContents(draggingMove.floatingEl, 
        draggingMove.originalType, 
        draggingMove.originalVariantString, 
        draggingMove.originalWidth);
    document.body.appendChild(draggingMove.floatingEl);

    if (system.cssTransform) {
      draggingMove.floatingEl.style[system.cssTransform] = 
          'translate(' + draggingMove.elX + 'px, ' + draggingMove.elY + 'px)';
    } else {
      draggingMove.floatingEl.style.left = draggingMove.elX + 'px';
      draggingMove.floatingEl.style.top = draggingMove.elY + 'px';
    }

    if (draggingMove.type == DRAGGING_TYPE_MOVE_TRANSFER) {
      draggingMove.originalEl.classList.add('dragged-out');
    }

    draggingMove.segmentBeforeEl = null;
    draggingMove.segmentAfterEl = null;
  }

  function _handleSegmentMoveMove(event) {
    var x = event.pageX;
    var y = event.pageY;

    var deltaX = x - draggingMove.mouseX;
    var deltaY = y - draggingMove.mouseY;

    draggingMove.elX += deltaX;
    draggingMove.elY += deltaY;

    if (!draggingMove.floatingElVisible) {
      draggingMove.floatingElVisible = true;

      if (system.touch) {
        if (draggingMove.type == DRAGGING_TYPE_MOVE_CREATE) {
          draggingMove.elY += DRAG_OFFSET_Y_TOUCH_PALETTE;
        } else {
          draggingMove.elY += DRAG_OFFSET_Y_TOUCH;
        }
      }

      window.setTimeout(function() {
        draggingMove.floatingEl.classList.remove('first-drag-move');      
      }, SHORT_DELAY);
    }    

    if (system.cssTransform) {
      draggingMove.floatingEl.style[system.cssTransform] = 
          'translate(' + draggingMove.elX + 'px, ' + draggingMove.elY + 'px)';

      var deg = deltaX;

      if (deg > MAX_DRAG_DEGREE) {
        deg = MAX_DRAG_DEGREE;
      } else if (deg < -MAX_DRAG_DEGREE) {
        deg = -MAX_DRAG_DEGREE;
      }

      if (system.cssTransform) {
        draggingMove.floatingEl.querySelector('canvas').style[system.cssTransform] = 
            'rotateZ(' + deg + 'deg)';
      }
    } else {
      draggingMove.floatingEl.style.left = draggingMove.elX + 'px';
      draggingMove.floatingEl.style.top = draggingMove.elY + 'px';
    }

    draggingMove.mouseX = x;
    draggingMove.mouseY = y;

    _makeSpaceBetweenSegments(x, y);

    if (draggingMove.type == DRAGGING_TYPE_MOVE_TRANSFER) {
      document.querySelector('#trashcan').classList.add('visible');
    }
  }

  function _hideDebugInfo() {
    document.querySelector('#debug').classList.remove('visible');
  }

  function _onBodyMouseDown(event) {
    var el = event.target;

    _loseAnyFocus();
    _hideDebugInfo();

    var topEl = event.target;
    // TODO nasty
    while (topEl && (topEl.id != 'info-bubble') && 
      (topEl.id != 'share-menu') && 
      (topEl.id != 'feedback-menu') && 
      (topEl.id != 'identity-menu')) {
      topEl = topEl.parentNode;
    }

    var withinInfoBubbleOrMenu = !!topEl;

    if (withinInfoBubbleOrMenu) {
      return;
    }

    _hideMenus();

    if (!el.classList.contains('info')) {
      _hideInfoBubble();
    }

    if (el.classList.contains('drag-handle')) {
      _handleSegmentResizeStart(event);
    } else {
      if (!el.classList.contains('segment') || 
          el.classList.contains('unmovable')) {
        return;
      }

      _handleSegmentMoveStart(event);
    }

    event.preventDefault();
  }

  function _makeSpaceBetweenSegments(x, y) {
    var left = x - streetSectionCanvasLeft;

    var selectedSegmentBefore = null;
    var selectedSegmentAfter = null;

    for (var i in street.segments) {
      var segment = street.segments[i];

      if (!selectedSegmentBefore && ((segment.el.savedLeft + segment.el.savedWidth / 2) > left)) {
        selectedSegmentBefore = segment.el;
      }

      if ((segment.el.savedLeft + segment.el.savedWidth / 2) <= left) {
        selectedSegmentAfter = segment.el;
      }
    }

    if ((selectedSegmentBefore != draggingMove.segmentBeforeEl) ||
        (selectedSegmentAfter != draggingMove.segmentAfterEl)) {
      draggingMove.segmentBeforeEl = selectedSegmentBefore;
      draggingMove.segmentAfterEl = selectedSegmentAfter;
      _repositionSegments();
    }
  }

  function _onBodyMouseMove(event) {
    mouseX = event.pageX;
    mouseY = event.pageY;

    if (draggingType == DRAGGING_TYPE_NONE) {
      return;
    }

    switch (draggingType) {
      case DRAGGING_TYPE_MOVE:
        _handleSegmentMoveMove(event);
        break;
      case DRAGGING_TYPE_RESIZE:
        _handleSegmentResizeMove(event);
        break;
    }

    event.preventDefault();
  }

  function _removeTouchSegmentFadeouts() {
    var els = document.querySelectorAll('.fade-out-end');
    for (var i = 0, el; el = els[i]; i++) {
      el.classList.remove('fade-out-end');
    }
  }

  function _createTouchSegmentFadeout(el) {
    if (system.touch) {
      _removeTouchSegmentFadeouts();

      window.clearTimeout(el.fadeoutTimerId);
      el.classList.remove('fade-out-end');
      el.classList.add('fade-out-start');

      window.setTimeout(function() {
        el.classList.remove('fade-out-start');
        el.classList.add('fade-out-end');
      }, 0);

      el.fadeoutTimerId = window.setTimeout(function() {
        el.classList.remove('fade-out-end');
      }, TOUCH_SEGMENT_FADEOUT_DELAY);
    }
  }

  function _handleSegmentMoveEnd(event) {
    ignoreStreetChanges = false;

    var el = document.elementFromPoint(draggingMove.mouseX, draggingMove.mouseY);
    while (el && (el.id != 'editable-street-section')) {
      el = el.parentNode;
    }
    var withinCanvas = !!el;

    if (!withinCanvas) {
      if (draggingMove.type == DRAGGING_TYPE_MOVE_TRANSFER) {
        _removeElFromDom(draggingMove.originalEl);
      }
    } else if (draggingMove.segmentBeforeEl || draggingMove.segmentAfterEl || (street.segments.length == 0)) {
      var width = draggingMove.originalWidth;

      if (draggingMove.type == DRAGGING_TYPE_MOVE_CREATE) {
        if ((street.remainingWidth > 0) && (width > street.remainingWidth * TILE_SIZE)) {

          var segmentMinWidth = 
              SEGMENT_INFO[draggingMove.originalType].details[draggingMove.originalVariantString].minWidth || 0;

          if ((street.remainingWidth >= MIN_SEGMENT_WIDTH) && 
              (street.remainingWidth >= segmentMinWidth)) {
            width = _normalizeSegmentWidth(street.remainingWidth, RESIZE_TYPE_INITIAL) * TILE_SIZE;
          }
        }
      }
      
      var newEl = _createSegment(draggingMove.originalType, 
          draggingMove.originalVariantString, width);

      newEl.classList.add('create');

      if (draggingMove.segmentBeforeEl) {
        document.querySelector('#editable-street-section').
            insertBefore(newEl, draggingMove.segmentBeforeEl);
      } else if (draggingMove.segmentAfterEl) {
        document.querySelector('#editable-street-section').
            insertBefore(newEl, draggingMove.segmentAfterEl.nextSibling);
      } else {
        // empty street
        document.querySelector('#editable-street-section').appendChild(newEl);
      }

      window.setTimeout(function() {
        newEl.classList.remove('create');
      }, SHORT_DELAY);

      if (draggingMove.type == DRAGGING_TYPE_MOVE_TRANSFER) {
        var draggedOutEl = document.querySelector('.segment.dragged-out');
        _removeElFromDom(draggedOutEl);
      }

      _createTouchSegmentFadeout(newEl);
    } else {            
      _createTouchSegmentFadeout(draggingMove.originalEl);

      draggingMove.originalEl.classList.remove('dragged-out');
    }

    _removeElFromDom(draggingMove.floatingEl);

    draggingMove.segmentBeforeEl = null;
    draggingMove.segmentAfterEl = null;
    _repositionSegments();
    _segmentsChanged();

    document.querySelector('#trashcan').classList.remove('visible');

    _changeDraggingType(DRAGGING_TYPE_NONE);
  }

  function _removeGuides(el) {
    var guideEl;
    while (guideEl = el.querySelector('.guide')) {
      _removeElFromDom(guideEl);
    }
  }

  function _handleSegmentResizeEnd(event) {
    ignoreStreetChanges = false;

    _segmentsChanged();

    _changeDraggingType(DRAGGING_TYPE_NONE);

    // TODO const
    var el = draggingResize.floatingEl;
    window.setTimeout(function() {
      _removeElFromDom(el);
    }, 250);
  
    draggingResize.segmentEl.classList.remove('hover');

    _removeGuides(draggingResize.segmentEl);
 
    _createTouchSegmentFadeout(draggingResize.segmentEl);
  }

  function _onBodyMouseUp(event) {
    switch (draggingType) {
      case DRAGGING_TYPE_NONE:
        return;
      case DRAGGING_TYPE_MOVE:
        _handleSegmentMoveEnd(event);
        break;
      case DRAGGING_TYPE_RESIZE:
        _handleSegmentResizeEnd(event);
        break;
    }

    event.preventDefault();
  }

  function _createPalette() {
    for (var i in SEGMENT_INFO) {
      var segmentInfo = SEGMENT_INFO[i];

      // TODO hack
      for (var j in segmentInfo.details) {
        var variantName = j;
        var variantInfo = segmentInfo.details[variantName];

        var width = segmentInfo.defaultWidth;

        if (variantInfo.realWidth > variantInfo.defaultWidth) {
          width = variantInfo.realWidth;
        }

        if (variantInfo.graphics.center && (width < (variantInfo.graphics.center.width + 1))) {
          width = variantInfo.graphics.center.width;
        }

        if (variantInfo.graphics.left && variantInfo.graphics.left.offsetX) {
          width -= variantInfo.graphics.left.offsetX;
        }
        if (variantInfo.graphics.right && variantInfo.graphics.right.offsetX) {
          width -= variantInfo.graphics.right.offsetX;
        }

        width += PALETTE_EXTRA_SEGMENT_PADDING;

        var el = _createSegment(i, 
          variantName,
          width * TILE_SIZE / WIDTH_PALETTE_MULTIPLIER, 
          false, 
          true);

        el.classList.add('palette');

        document.querySelector('#palette').appendChild(el);
      }
    }
  }

  function _resizeStreetWidth() {
    var width = street.width * TILE_SIZE;

    document.querySelector('#street-section-canvas').style.width = width + 'px';

    _onResize();
  }

  function _resizeStreetName() {
    var streetNameCanvasWidth = 
        document.querySelector('#street-name-canvas').offsetWidth;
    var streetNameWidth = 
        document.querySelector('#street-name > div').scrollWidth;

    if (streetNameWidth > streetNameCanvasWidth) {
      document.querySelector('#street-name').style.width = streetNameCanvasWidth + 'px';
    } else {
      document.querySelector('#street-name').style.width = 'auto';
    }
  }

  function _updateScrollButtons() {
    var els = document.querySelectorAll('[scroll-buttons]');
    for (var i = 0, el; el = els[i]; i++) {
      _repositionScrollButtons(el);
      _scrollButtonScroll(el);
    }
  }

  function _onResize() {
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;

    var streetSectionHeight = 
        document.querySelector('#street-section').offsetHeight;

    var paletteTop = document.querySelector('footer').offsetTop;

    var pos = (viewportHeight - streetSectionHeight) / 2;

    // TODO const
    if (pos + document.querySelector('#street-section').offsetHeight > 
      paletteTop - 20) {
      pos = paletteTop - 20 - streetSectionHeight;
    }

    document.querySelector('#street-section').style.top = pos + 'px';

    if (pos < 0) {
      pos = 0;
    }
    document.querySelector('#street-section-sky').style.paddingTop = pos + 'px';
    document.querySelector('#street-section-sky').style.marginTop = -pos + 'px';

    streetSectionCanvasLeft = 
        ((viewportWidth - street.width * TILE_SIZE) / 2);

    document.querySelector('#street-section-canvas').style.left = 
      streetSectionCanvasLeft + 'px';

    document.querySelector('#editable-street-section').style.width = 
      (street.width * TILE_SIZE) + 'px';

    _resizeStreetName();

    _updateScrollButtons();
  }

  function _fillDefaultSegments() {
    street.segments = [];

    for (var i in DEFAULT_SEGMENTS[leftHandTraffic]) {
      var segment = DEFAULT_SEGMENTS[leftHandTraffic][i];
      segment.warnings = [];
      segment.variantString = _getVariantString(segment.variant);

      street.segments.push(segment);
    }

    _normalizeAllSegmentWidths();
  }

  function _createStreetWidthOption(width) {
    var el = document.createElement('option');
    el.value = width;
    el.innerHTML = _prettifyWidth(width, PRETTIFY_WIDTH_OUTPUT_NO_MARKUP);
    return el;
  }

  function _buildStreetWidthMenu() {
    document.querySelector('#street-width').innerHTML = '';

    var el = document.createElement('option');
    el.disabled = true;
    el.innerHTML = 'Building-to-building width:';
    document.querySelector('#street-width').appendChild(el);  

    var widths = [];    

    for (var i in DEFAULT_STREET_WIDTHS) {
      var width = _normalizeStreetWidth(DEFAULT_STREET_WIDTHS[i]);
      var el = _createStreetWidthOption(width);
      document.querySelector('#street-width').appendChild(el);

      widths.push(width);
    }

    if (widths.indexOf(parseFloat(street.width)) == -1) {
      var el = document.createElement('option');
      el.disabled = true;
      document.querySelector('#street-width').appendChild(el);      

      var el = _createStreetWidthOption(street.width);
      document.querySelector('#street-width').appendChild(el);      
    }

    var el = document.createElement('option');
    el.value = STREET_WIDTH_CUSTOM;
    el.innerHTML = 'Custom…';
    document.querySelector('#street-width').appendChild(el);  

    var el = document.createElement('option');
    el.disabled = true;
    document.querySelector('#street-width').appendChild(el);  

    var el = document.createElement('option');
    el.value = STREET_WIDTH_SWITCH_TO_IMPERIAL;
    el.id = 'switch-to-imperial-units';
    el.innerHTML = msg('MENU_SWITCH_TO_IMPERIAL');
    if (street.units == SETTINGS_UNITS_IMPERIAL) {
      el.disabled = true;
    }
    document.querySelector('#street-width').appendChild(el);  

    var el = document.createElement('option');
    el.value = STREET_WIDTH_SWITCH_TO_METRIC;
    el.id = 'switch-to-metric-units';
    el.innerHTML = msg('MENU_SWITCH_TO_METRIC');
    if (street.units == SETTINGS_UNITS_METRIC) {
      el.disabled = true;
    }

    document.querySelector('#street-width').appendChild(el);  

    document.querySelector('#street-width').value = street.width;   
  }

  function _onStreetWidthChange(event) {
    var el = event.target;
    var newStreetWidth = el.value;

    if (newStreetWidth == street.width) {
      return;
    } else if (newStreetWidth == STREET_WIDTH_SWITCH_TO_METRIC) {
      _updateUnits(SETTINGS_UNITS_METRIC);
      return;
    } else if (newStreetWidth == STREET_WIDTH_SWITCH_TO_IMPERIAL) {
      _updateUnits(SETTINGS_UNITS_IMPERIAL);
      return;
    } else if (newStreetWidth == STREET_WIDTH_CUSTOM) {
      _ignoreWindowFocusMomentarily();
      // TODO string
      var width = prompt("New street width (from " + 
          _prettifyWidth(MIN_CUSTOM_STREET_WIDTH, PRETTIFY_WIDTH_OUTPUT_NO_MARKUP) + 
          " to " + 
          _prettifyWidth(MAX_CUSTOM_STREET_WIDTH, PRETTIFY_WIDTH_OUTPUT_NO_MARKUP) + 
          "):");

      if (width) {
        width = _normalizeStreetWidth(_processWidthInput(width));
      }

      if (!width) {
        _buildStreetWidthMenu();

        _loseAnyFocus();
        return;
      }

      if (width < MIN_CUSTOM_STREET_WIDTH) {
        width = MIN_CUSTOM_STREET_WIDTH;
      } else if (width > MAX_CUSTOM_STREET_WIDTH) {
        width = MAX_CUSTOM_STREET_WIDTH;
      }
      newStreetWidth = width;
    }

    street.width = _normalizeStreetWidth(newStreetWidth);
    _buildStreetWidthMenu();
    _resizeStreetWidth();

    initializing = true;

    _createDomFromData();
    _segmentsChanged();

    initializing = false; 

    _loseAnyFocus();   
  }

  function _removeSegment(el, all) {
    if (all) {
      street.segments = [];
      _createDomFromData();
      _segmentsChanged();

      _statusMessage.show(msg('STATUS_ALL_SEGMENTS_DELETED'), true);
    } else if (el && el.parentNode) {
      _removeElFromDom(el);
      _segmentsChanged();

      _statusMessage.show(msg('STATUS_SEGMENT_DELETED'), true);
    }
  } 

  function _getHoveredSegmentEl() {
    var el = document.elementFromPoint(mouseX, mouseY);
    while (el && el.classList && !el.classList.contains('segment')) {
      el = el.parentNode;
    }

    if (el.classList && el.classList.contains('segment')) {
      return el;
    } else {
      return null;
    }
  }

  function _showDebugInfo() {
    var debugStreetData = _clone(street);
    var debugUndo = _clone(undoStack);
    var debugSettings = _clone(settings);

    for (var i in debugStreetData.segments) {
      delete debugStreetData.segments[i].el;
    }

    for (var j in debugUndo) {
      for (var i in debugUndo[j].segments) {
        delete debugUndo[j].segments[i].el;
      }
    }

    var debugText = 
        'DATA:\n' + JSON.stringify(debugStreetData, null, 2) +
        '\n\nSETTINGS:\n' + JSON.stringify(debugSettings, null, 2) +
        '\n\nUNDO:\n' + JSON.stringify(debugUndo, null, 2);

    document.querySelector('#debug').classList.add('visible');
    document.querySelector('#debug > textarea').innerHTML = debugText;
    document.querySelector('#debug > textarea').focus();
    document.querySelector('#debug > textarea').select();
    event.preventDefault();
  }

  function _onBodyKeyDown(event) {
    switch (event.keyCode) {
      case KEY_RIGHT_ARROW:
      case KEY_EQUAL:
        if (event.metaKey || event.ctrlKey || event.altKey) {
          return;
        }

        if (document.activeElement == document.body) {
          var segmentHoveredEl = _getHoveredSegmentEl();
          if (segmentHoveredEl) {
            _incrementSegmentWidth(segmentHoveredEl, true, event.shiftKey);
          }
          event.preventDefault();
        }
        break;
      case KEY_LEFT_ARROW:
      case KEY_MINUS:
        if (event.metaKey || event.ctrlKey || event.altKey) {
          return;
        }

        if (document.activeElement == document.body) {
          var segmentHoveredEl = _getHoveredSegmentEl();
          if (segmentHoveredEl) {
            _incrementSegmentWidth(segmentHoveredEl, false, event.shiftKey);
          }
          event.preventDefault();
        }
        break;
      case KEY_BACKSPACE:
      case KEY_DELETE:
        if (event.metaKey || event.ctrlKey || event.altKey) {
          return;
        }

        if (document.activeElement == document.body) {
          var segmentHoveredEl = _getHoveredSegmentEl();
          _removeSegment(segmentHoveredEl, event.shiftKey);
          event.preventDefault();
        }
        break;
      case KEY_ESC:
        _hideDebugInfo();
        whatIsThis.hideInfo();

        if (document.body.classList.contains('gallery-visible')) {
          _hideGallery(false);
        } else {
          if (infoBubbleVisible) {
            _hideInfoBubble();
          }
        }
        event.preventDefault();
        break;
      case KEY_Z:
        if (!event.shiftKey && (event.metaKey || event.ctrlKey)) {
          _undo();
          event.preventDefault();
        } else if (event.shiftKey && (event.metaKey || event.ctrlKey)) {
          _redo();
          event.preventDefault();
        }
        break;
      case KEY_S:
        if (event.metaKey || event.ctrlKey) {
          _statusMessage.show(msg('STATUS_NO_NEED_TO_SAVE'));
          event.preventDefault();
        }
        break;
      case KEY_Y:
        if (event.metaKey || event.ctrlKey) {
          _redo();
          event.preventDefault();
        }   
        break;   
      case KEY_D:
        if (event.shiftKey && (document.activeElement == document.body)) {
          _showDebugInfo();
          event.preventDefault();
        }
        break;
    }
  }

  function _onRemoveButtonClick(event) {
    var el = event.target.segmentEl;

    if (el) {
      _removeSegment(el, event.shiftKey);
    }
  }

  function _normalizeSlug(slug) {
    slug = slug.toLowerCase();
    slug = slug.replace(/ /g, '-');
    slug = slug.replace(/-{2,}/, '-');
    slug = slug.replace(/^[-]+|[-]+$/g, '');
    slug = slug.replace(/[^a-zA-Z0-9\-]/g, '');

    return slug;
  }

  function _getStreetUrl(street) {
    var url = '/';

    if (street.creatorId) {
      if (RESERVED_URLS.indexOf(street.creatorId) != -1) {
        url += URL_RESERVED_PREFIX;
      }

      url += street.creatorId;
    } else {
      url += URL_NO_USER;
    }

    url += '/';

    url += street.namespacedId;

    if (street.creatorId) {
      //console.log('name', street.name);
      var slug = _normalizeSlug(street.name);
      url += '/' + encodeURIComponent(slug);
    }

    return url;
  }

  function _updatePageUrl(forceGalleryUrl) {
    if (forceGalleryUrl) {
      var url = '/' + galleryUserId;
    } else {
      var url = _getStreetUrl(street);
    }

    window.history.replaceState(null, null, url);

    _updateShareMenu();
  }

  function _updatePageTitle() {
    // TODO const/interpolate
    var title = street.name;

    if (street.creatorId && (!signedIn || (signInData.userId != street.creatorId))) {
      title += ' (by ' + street.creatorId + ')';
    }

    title += ' – Streetmix';

    document.title = title;
  }

  function _onAnotherUserIdClick(event) {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      return;
    }

    var el = event.target;

    var userId = el.innerHTML;

    _showGallery(userId, false);

    event.preventDefault();
  }

  function _updateStreetNameFont(el) {
    var name = el.innerHTML;

    var usingSupportedGlyphs = true;
    for (var i in name) {
      if (STREET_NAME_FONT_GLYPHS.indexOf(name.charAt(i)) == -1) {
        usingSupportedGlyphs = false;
        break;
      }
    }


    if (usingSupportedGlyphs) {
      el.classList.remove('fallback-unicode-font');
    } else {
      el.classList.add('fallback-unicode-font');
    }
  }

  function _updateStreetAttribution() {
    if (street.creatorId && (!signedIn || (street.creatorId != signInData.userId))) {
      // TODO const
      var html = "by <div class='avatar' userId='" + street.creatorId + "'></div>" +
          "<a class='user-gallery' href='/" +  
          street.creatorId + "'>" + street.creatorId + "</a> · " +
          _formatDate(moment(street.updatedAt));

      document.querySelector('#street-attribution').innerHTML = html;

      _fetchAvatars();

      document.querySelector('#street-attribution .user-gallery').addEventListener('click', _onAnotherUserIdClick);
    } else if (!street.creatorId && (signedIn || remixOnFirstEdit)) {
      var html = "by Anonymous · " + _formatDate(moment(street.updatedAt));

      document.querySelector('#street-attribution').innerHTML = html;
    } else {
      var html = _formatDate(moment(street.updatedAt));

      document.querySelector('#street-attribution').innerHTML = html;      
    }

    if (!document.querySelector('#new-street-menu').classList.contains('visible')) {
      document.querySelector('#street-attribution').classList.add('visible');
    }
  }

  function _hideStreetAttribution() {
    document.querySelector('#street-attribution').classList.remove('visible');
  }

  function _updateStreetName() {
    $('#street-name > div').text(street.name);

    _updateStreetNameFont(document.querySelector('#street-name'));

    _resizeStreetName();

    _updateStreetAttribution();

    _unifyUndoStack();
    _updatePageUrl();
    _updatePageTitle();
  }

  function _normalizeStreetName(name) {
    name = jQuery.trim(name);

    if (name.length > MAX_STREET_NAME_WIDTH) {
      name = name.substr(0, MAX_STREET_NAME_WIDTH) + '…';
    }

    return name;
  }

  function _askForStreetName() {
    _ignoreWindowFocusMomentarily();
    var newName = prompt(msg('PROMPT_NEW_STREET_NAME'), street.name);

    if (newName) {
      street.name = _normalizeStreetName(newName);

      _updateStreetName();
      _saveStreetToServerIfNecessary();
    }
  }

  function _fetchStreetForVerification() {
    // Don’t do it with any network services pending
    if (_getNonblockingAjaxRequestCount() || blockingAjaxRequestInProgress || 
        saveStreetIncomplete || abortEverything) {
      return;
    }

    var url = _getFetchStreetUrl();

    jQuery.ajax({
      url: url,
      dataType: 'json',
      type: 'GET',
    }).done(_receiveStreetForVerification).fail(_errorReceiveStreetForVerification);
  }

  function _receiveStreetForVerification(transmission) {
    var localStreetData = _trimStreetData(street);
    var serverStreetData = _trimStreetData(_unpackStreetDataFromServerTransmission(transmission));

    if (JSON.stringify(localStreetData) != JSON.stringify(serverStreetData)) {
      console.log('NOT EQUAL');
      console.log('-');
      console.log(JSON.stringify(localStreetData));
      console.log('-');
      console.log(JSON.stringify(serverStreetData));
      console.log('-');
      console.log(transmission);

      _statusMessage.show(msg('STATUS_RELOADED_FROM_SERVER'));

      _unpackServerStreetData(transmission);
      _updateEverything();
    }
  }

  function _errorReceiveStreetForVerification(data) {
    // 404 should never happen here, since 410 designates streets that have
    // been deleted (but remain hidden on the server)

    if (signedIn && ((data.status == 404) || (data.status == 410))) {
      // Means street was deleted

      _showError(ERROR_STREET_DELETED_ELSEWHERE, true);
    }
  }

  // Because Firefox is stupid and their prompt() dialog boxes are not quite 
  // modal.
  function _ignoreWindowFocusMomentarily() {
    ignoreWindowFocus = true;
    window.setTimeout(function() {
      ignoreWindowFocus = false;
    }, 50);
  }

  function _onWindowFocus() {
    if (abortEverything) {
      return;
    }

    if (ignoreWindowFocus) {
      return;
    }

    if (!galleryVisible) {
      _fetchStreetForVerification();

      // Save settings on window focus, so the last edited street is the one you’re
      // currently looking at (in case you’re looking at many streets in various
      // tabs)
      _saveSettingsLocally();
    }
  }

  function _onWindowBlur() {
    if (abortEverything) {
      return;
    }

    _hideMenus();
  }

  function _onStorageChange() {
    if (signedIn && !window.localStorage[LOCAL_STORAGE_SIGN_IN_ID]) {
      mode = MODE_FORCE_RELOAD_SIGN_OUT;
      _processMode();
    } else if (!signedIn && window.localStorage[LOCAL_STORAGE_SIGN_IN_ID]) {
      console.log('blah', window.localStorage[LOCAL_STORAGE_SIGN_IN_ID]);
      mode = MODE_FORCE_RELOAD_SIGN_IN;
      _processMode();      
    }
  }

  function _makeDefaultStreet() {
    ignoreStreetChanges = true;
    _prepareDefaultStreet();
    _setUpdateTimeToNow();

    _resizeStreetWidth();
    _updateStreetName();
    _createDomFromData();
    _segmentsChanged();
    _updateShareMenu();

    ignoreStreetChanges = false;
    lastStreet = _trimStreetData(street);

    _saveStreetToServer(false);
  }

  function _onNewStreetDefaultClick() {
    settings.newStreetPreference = NEW_STREET_DEFAULT;
    _saveSettingsLocally();

    _makeDefaultStreet();
  }

  function _onNewStreetEmptyClick() {
    settings.newStreetPreference = NEW_STREET_EMPTY;
    _saveSettingsLocally();

    ignoreStreetChanges = true;
    _prepareEmptyStreet();

    _resizeStreetWidth();
    _updateStreetName();
    _createDomFromData();
    _segmentsChanged();
    _updateShareMenu();

    ignoreStreetChanges = false;
    lastStreet = _trimStreetData(street);

    _saveStreetToServer(false);
  }

  function _onNewStreetLastClick() {
    _fetchLastStreet();
  }

  function _fetchLastStreet() {
    _newBlockingAjaxRequest('Loading…', 
        {
          // TODO const
          url: system.apiUrl + 'v1/streets/' + settings.priorLastStreetId,
          dataType: 'json',
          type: 'GET',
          headers: { 'Authorization': _getAuthHeader() }
        }, _receiveLastStreet, _cancelReceiveLastStreet
    );
  }

  function _cancelReceiveLastStreet() {
    document.querySelector('#new-street-default').checked = true;
    _makeDefaultStreet();
  }

  function _receiveLastStreet(transmission) {
    //console.log('received last street', transmission);

    ignoreStreetChanges = true;

    _unpackServerStreetData(transmission, street.id, street.namespacedId);
    street.originalStreetId = settings.priorLastStreetId;
    _addRemixSuffixToName();

    if (signedIn) {
      _setStreetCreatorId(signInData.userId);
    } else {
      _setStreetCreatorId(null);
    }
    _setUpdateTimeToNow();

    _propagateUnits();

    // TODO this is stupid, only here to fill some structures
    _createDomFromData();
    _createDataFromDom();

    _unifyUndoStack();

    _resizeStreetWidth();
    _updateStreetName();
    _createDomFromData();
    _segmentsChanged();
    _updateShareMenu();

    ignoreStreetChanges = false;
    lastStreet = _trimStreetData(street);

    _saveStreetToServer(false);
  }

  function _showNewStreetMenu() {
    switch (settings.newStreetPreference) {
      case NEW_STREET_EMPTY:
        document.querySelector('#new-street-empty').checked = true;
        break;
      case NEW_STREET_DEFAULT:
        document.querySelector('#new-street-default').checked = true;
        break;
    }

    if (settings.priorLastStreetId && settings.priorLastStreetId != street.id) {
      document.querySelector('#new-street-last').parentNode.classList.add('visible');
    }

    document.querySelector('#new-street-menu').classList.add('visible');
    document.querySelector('#street-attribution').classList.remove('visible');
  }

  function _hideNewStreetMenu() {
    document.querySelector('#new-street-menu').classList.remove('visible');
    document.querySelector('#street-attribution').classList.add('visible');
  }

  function _fetchGalleryData() {
    if (galleryUserId) {
      jQuery.ajax({
        // TODO const
        url: system.apiUrl + 'v1/users/' + galleryUserId + '/streets',
        dataType: 'json',
        type: 'GET',
        headers: { 'Authorization': _getAuthHeader() }
      }).done(_receiveGalleryData).fail(_errorReceiveGalleryData);
    } else {
      jQuery.ajax({
        // TODO const
        url: system.apiUrl + 'v1/streets',
        dataType: 'json',
        type: 'GET',
      }).done(_receiveGalleryData).fail(_errorReceiveGalleryData);      
    }
  }

  function _errorReceiveGalleryData(data) {
    if ((mode == MODE_USER_GALLERY) && (data.status == 404)) {
      mode = MODE_404;
      _processMode();
      _hideGallery(true);
    } else {
      document.querySelector('#gallery .loading').classList.remove('visible');
      document.querySelector('#gallery .error-loading').classList.add('visible');    
    }
  }

  function _repeatReceiveGalleryData() {
    _loadGalleryContents();
  }

  function _fetchGalleryStreet(streetId) {
    //console.log('fetching', streetId);

    _showBlockingShield();

    //console.log(system.apiUrl + 'v1/streets/' + streetId);

    jQuery.ajax({
      // TODO const
      url: system.apiUrl + 'v1/streets/' + streetId,
      dataType: 'json',
      type: 'GET',
      headers: { 'Authorization': _getAuthHeader() }
    }).done(_receiveGalleryStreet)
    .fail(_errorReceiveGalleryStreet);
  }

  function _errorReceiveGalleryStreet() {
    _hideBlockingShield();
    galleryStreetLoaded = true;
    galleryStreetId = street.id; 

    _updateGallerySelection();
  }

  function _checkIfNeedsToBeRemixed() {
    if (!signedIn || (street.creatorId != signInData.userId)) {
      remixOnFirstEdit = true;
    } else {
      remixOnFirstEdit = false;
    }
  }

  function _receiveStreet(transmission) {
    //console.log('received street', transmission);

    _unpackServerStreetData(transmission);

    _checkIfNeedsToBeRemixed();

    _propagateUnits();

    // TODO this is stupid, only here to fill some structures
    _createDomFromData();
    _createDataFromDom();

    serverContacted = true;
    _checkIfEverythingIsLoaded();
  }  

  // TODO similar to receiveLastStreet
  function _receiveGalleryStreet(transmission) {
    if (transmission.id != galleryStreetId) {
      return;
    }

    galleryStreetLoaded = true;

    _hideBlockingShield();

    ignoreStreetChanges = true;

    _hideError();

    _unpackServerStreetData(transmission);

    _checkIfNeedsToBeRemixed();

    _propagateUnits();

    // TODO this is stupid, only here to fill some structures
    _createDomFromData();
    _createDataFromDom();

    _hideNewStreetMenu();
    _resizeStreetWidth();
    _updateStreetName();
    _createDomFromData();
    _segmentsChanged();
    _updateShareMenu();

    ignoreStreetChanges = false;
    lastStreet = _trimStreetData(street);
  }

  function _updateGallerySelection() {
    var els = document.querySelectorAll('#gallery .streets .selected');
    for (var i = 0, el; el = els[i]; i++) {
      el.classList.remove('selected');
    }

    var el = document.querySelector('#gallery .streets [streetId="' + galleryStreetId + '"]');
    if (el) {
      el.classList.add('selected');
    }
  }

  function _switchGalleryStreet(id) {
    galleryStreetId = id;

    _updateGallerySelection();
    _fetchGalleryStreet(galleryStreetId);    
  }

  function _onGalleryStreetClick(event) {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      return;
    }

    var el = this;
    _switchGalleryStreet(el.getAttribute('streetId'));

    event.preventDefault();
  }

  function _formatDate(date) {
    // TODO hack
    var today = moment(new Date().getTime());
    // TODO const
    var todayFormat = today.format('MMM D, YYYY');
    var dateFormat = date.format('MMM D, YYYY');

    if (dateFormat != todayFormat) {
      return dateFormat;
    } else {
      return '';
    }
  }

  function _clearBlockingShieldTimers() {
    window.clearTimeout(blockingShieldTimerId);
    window.clearTimeout(blockingShieldTooSlowTimerId);
  }

  function _showBlockingShield(message) {
    if (!message) {
      message = 'Loading…';
    }

    _hideBlockingShield();
    _clearBlockingShieldTimers();

    document.querySelector('#blocking-shield .message').innerHTML = message;

    document.querySelector('#blocking-shield').classList.add('visible');

    blockingShieldTimerId = window.setTimeout(function() {
      document.querySelector('#blocking-shield').classList.add('darken');
    }, BLOCKING_SHIELD_DARKEN_DELAY);

    blockingShieldTooSlowTimerId = window.setTimeout(function() {
      document.querySelector('#blocking-shield').classList.add('show-too-slow');
    }, BLOCKING_SHIELD_TOO_SLOW_DELAY);
  }

  function _darkenBlockingShield(message) {
    _clearBlockingShieldTimers();
    document.querySelector('#blocking-shield').classList.add('darken-immediately');
  }

  function _hideBlockingShield() {
    _clearBlockingShieldTimers();
    document.querySelector('#blocking-shield').classList.remove('visible');
    document.querySelector('#blocking-shield').classList.remove('darken');
    document.querySelector('#blocking-shield').classList.remove('darken-immediately');
    document.querySelector('#blocking-shield').classList.remove('show-try-again');
    document.querySelector('#blocking-shield').classList.remove('show-too-slow');
    document.querySelector('#blocking-shield').classList.remove('show-cancel');
  }

  function _onDeleteGalleryStreet(event) {
    var el = event.target.parentNode;
    var name = el.streetName;

    var prompt = 
      'Are you sure you want to permanently delete ' + name + '? This cannot be undone.';

    _ignoreWindowFocusMomentarily();
    // TODO escape name
    if (confirm(prompt)) {
      if (el.getAttribute('streetId') == street.id) {
        _showError(ERROR_NO_STREET, false);
      }

      _sendDeleteStreetToServer(el.getAttribute('streetId'));

      _removeElFromDom(el);
    }

    event.preventDefault();
    event.stopPropagation();
  }

  function _sendDeleteStreetToServer(id) {
    // Prevents new street submenu from showing the last street
    if (settings.lastStreetId == id) {
      settings.lastStreetId = null;
      settings.lastStreetCreatorId = null;
      settings.lastStreetNamespacedId = null;
      
      _saveSettingsLocally();
      _saveSettingsToServer();
    }

    _newNonblockingAjaxRequest({
      // TODO const
      url: system.apiUrl + 'v1/streets/' + id,
      dataType: 'json',
      type: 'DELETE',
      headers: { 'Authorization': _getAuthHeader() }
    }, false);
  }

  function _receiveGalleryData(transmission) {
    //console.log('receive gallery data', transmission);

    document.querySelector('#gallery .loading').classList.remove('visible');

    if (galleryUserId) {
      var streetCount = transmission.streets.length;
      switch (streetCount) {
        case 0: 
          var text = 'No streets yet';
          break;
        case 1:
          var text = '1 street';
          break;
        default:
          var text = streetCount += ' streets';
          break;
      }
      document.querySelector('#gallery .street-count').innerHTML = text;
    }

    for (var i in transmission.streets) {
      var galleryStreet = transmission.streets[i];

      var el = document.createElement('li');

      var anchorEl = document.createElement('a');

      galleryStreet.creatorId = 
          (galleryStreet.creator && galleryStreet.creator.id) || 'Anonymous';

      //console.log(galleryStreet);

      galleryStreet.name = galleryStreet.name || DEFAULT_NAME;

      anchorEl.href = _getStreetUrl(galleryStreet);
      
      anchorEl.streetName = galleryStreet.name;
      anchorEl.setAttribute('streetId', galleryStreet.id);

      if (galleryStreetId == galleryStreet.id) {
        anchorEl.classList.add('selected');
      }

      $(anchorEl).click(_onGalleryStreetClick);

      var nameEl = document.createElement('div');
      nameEl.classList.add('street-name');
      nameEl.innerHTML = '<div></div>';
      anchorEl.appendChild(nameEl);
      _updateStreetNameFont(nameEl);

      $(nameEl.querySelector('div')).text(galleryStreet.name);

      var date = moment(galleryStreet.updatedAt);
      var dateEl = document.createElement('span');
      dateEl.classList.add('date');
      dateEl.innerHTML = _formatDate(date);
      anchorEl.appendChild(dateEl);

      if (!galleryUserId && galleryStreet.creatorId) {
        var creatorEl = document.createElement('span');
        creatorEl.classList.add('creator');
        creatorEl.innerHTML = galleryStreet.creatorId;
        anchorEl.appendChild(creatorEl);
      }

      // Only show delete links if you own the street
      if (signedIn && (galleryStreet.creatorId == signInData.userId)) {
        var removeEl = document.createElement('button');
        removeEl.classList.add('remove');
        removeEl.addEventListener('click', _onDeleteGalleryStreet);
        removeEl.innerHTML = '×';
        removeEl.title = 'Delete the street';
        anchorEl.appendChild(removeEl);
      }

      el.appendChild(anchorEl);
      document.querySelector('#gallery .streets').appendChild(el);
    }

    if (((mode == MODE_USER_GALLERY) && streetCount) || (mode == MODE_GLOBAL_GALLERY)) {
      _switchGalleryStreet(transmission.streets[0].id);
    }

    var el = document.querySelector('#gallery .selected');
    if (el) {
      //console.log(el.parentNode.parentNode.scrollLeft);
      el.scrollIntoView();
      //console.log(el.parentNode.parentNode.scrollLeft);
      document.querySelector('#gallery').scrollTop = 0;
    }

    _updateScrollButtons();
  }

  function _loadGalleryContents() {
    var els = document.querySelectorAll('#gallery .streets li');
    for (var i = 0, el; el = els[i]; i++) {
      _removeElFromDom(el);
    }

    //document.querySelector('#gallery .streets').innerHTML = '';
    document.querySelector('#gallery .loading').classList.add('visible');
    document.querySelector('#gallery .error-loading').classList.remove('visible');

    _fetchGalleryData();  
  }

  function _showGallery(userId, instant) {
    galleryVisible = true;
    galleryStreetLoaded = true;
    galleryStreetId = street.id;
    galleryUserId = userId;

    if (userId) {
      document.querySelector('#gallery .avatar').setAttribute('userId', galleryUserId);
      document.querySelector('#gallery .avatar').removeAttribute('loaded');
      _fetchAvatars();
      document.querySelector('#gallery .user-id').innerHTML = galleryUserId;

      var linkEl = document.createElement('a');
      // TODO const
      linkEl.href = 'https://twitter.com/' + galleryUserId;
      linkEl.innerHTML = 'Twitter profile »';
      linkEl.classList.add('twitter-profile');
      linkEl.target = '_blank';
      document.querySelector('#gallery .user-id').appendChild(linkEl);

    } else {
      document.querySelector('#gallery .user-id').innerHTML = 'All streets';      
    }


    document.querySelector('#gallery .street-count').innerHTML = '';

    _statusMessage.hide();

    // TODO no class, but type?
    if (!userId) {
      document.querySelector('#gallery').classList.add('all-streets');
      document.querySelector('#gallery').classList.remove('another-user');
    } else if (signedIn && (userId == signInData.userId)) {
      document.querySelector('#gallery').classList.remove('another-user');
      document.querySelector('#gallery').classList.remove('all-streets');
    } else {
      document.querySelector('#gallery').classList.add('another-user'); 
      document.querySelector('#gallery').classList.remove('all-streets');
    }

    if (instant) {
      document.body.classList.add('gallery-no-move-transition');
    }
    document.body.classList.add('gallery-visible');

    if (instant) {
      window.setTimeout(function() {
        document.body.classList.remove('gallery-no-move-transition');
      }, 0);
    }

    if ((mode == MODE_USER_GALLERY) || (mode == MODE_GLOBAL_GALLERY)) {
      // Prevents showing old street before the proper street loads
      _showError(ERROR_NO_STREET, false);
    }

    _loadGalleryContents();

    _updatePageUrl(true);
  }

  function _onGalleryShieldClick(event) {
    _hideGallery(false);
  }

  function _hideGallery(instant) {
    if ((currentErrorType != ERROR_NO_STREET) && galleryStreetLoaded) {
      galleryVisible = false;

      if (instant) {
        document.body.classList.add('gallery-no-move-transition');
      }
      document.body.classList.remove('gallery-visible');

      if (instant) {
        window.setTimeout(function() {
          document.body.classList.remove('gallery-no-move-transition');
        }, 0);
      }

      _onWindowFocus();

      if (!abortEverything) {
        _updatePageUrl();
      }

      mode = MODE_CONTINUE;      
    }
  }

  function _onMyStreetsClick(event) {
    _showGallery(signInData.userId, false);

    event.preventDefault();
  }

  function _onVisibilityChange() {
    var hidden = document.hidden || document.webkitHidden || 
        document.msHidden || document.mozHidden;

    if (hidden) {
      _onWindowBlur();
    } else {
      _onWindowFocus();
    }
  }

  function _isFeedbackFormMessagePresent() {
    var message = document.querySelector('#feedback-form-message').value;
    message = jQuery.trim(message);

    return message.length > 0;
  }

  function _updateFeedbackForm() {
    if (_isFeedbackFormMessagePresent()) {
      document.querySelector('#feedback-form-send').disabled = false;
    } else {
      document.querySelector('#feedback-form-send').disabled = true;
    }
  }

  function _onFeedbackFormEmailKeyDown(event) {
    if (event.keyCode == KEY_ENTER) {
      _feedbackFormSend();
    }
  }

  function _feedbackFormSend() {
    if (_isFeedbackFormMessagePresent()) {

      document.querySelector('#feedback-form .loading').classList.add('visible');

      var additionalInformation = '\nUser agent: ' + navigator.userAgent;
      if (system.ipAddress) {
        additionalInformation += '\nIP: ' + system.ipAddress;
      }
      //additionalInformation += '\nSettings: ' + JSON.stringify(settings);

      var transmission = {
        message: document.querySelector('#feedback-form-message').value,
        from: document.querySelector('#feedback-form-email').value,
        additionalInformation: additionalInformation
      };

      _newNonblockingAjaxRequest({
        // TODO const
        url: system.apiUrl + 'v1/feedback',
        data: JSON.stringify(transmission),
        dataType: 'json',
        type: 'POST',
        contentType: 'application/json',
      }, true, _feedbackFormSuccess);
    }
  }

  function _feedbackFormSuccess() {
    document.querySelector('#feedback-form .loading').classList.remove('visible');
    document.querySelector('#feedback-form .thank-you').classList.add('visible');

    // TODO better remove
    window.localStorage[LOCAL_STORAGE_FEEDBACK_BACKUP] = '';
    window.localStorage[LOCAL_STORAGE_FEEDBACK_EMAIL_BACKUP] = '';

    // TODO const
    window.setTimeout(_hideMenus, 2500);
  }

  function _onFeedbackFormInput() {
    window.localStorage[LOCAL_STORAGE_FEEDBACK_BACKUP] = 
        document.querySelector('#feedback-form-message').value;
    window.localStorage[LOCAL_STORAGE_FEEDBACK_EMAIL_BACKUP] = 
        document.querySelector('#feedback-form-email').value;

    _updateFeedbackForm();
  }

  function _addEventListeners() {
    document.querySelector('#new-street').addEventListener('click', _goNewStreet);
    document.querySelector('#copy-last-street').addEventListener('click', _goCopyLastStreet);

    document.querySelector('#feedback-form-message').addEventListener('input', _onFeedbackFormInput, false);
    document.querySelector('#feedback-form-email').addEventListener('input', _onFeedbackFormInput, false);
    document.querySelector('#feedback-form-email').addEventListener('keydown', _onFeedbackFormEmailKeyDown, false);
    document.querySelector('#feedback-form-send').addEventListener('click', _feedbackFormSend, false);

    document.querySelector('#gallery-try-again').addEventListener('click', _repeatReceiveGalleryData);

    document.querySelector('#no-connection-try-again').addEventListener('click', _nonblockingAjaxTryAgain);

    document.querySelector('#blocking-shield-cancel').addEventListener('click', _blockingCancel);
    document.querySelector('#blocking-shield-try-again').addEventListener('click', _blockingTryAgain);
    document.querySelector('#blocking-shield-reload').addEventListener('click', _goReload);
    document.querySelector('#gallery-shield').addEventListener('click', _onGalleryShieldClick);

    document.querySelector('#new-street-default').addEventListener('click', _onNewStreetDefaultClick);
    document.querySelector('#new-street-empty').addEventListener('click', _onNewStreetEmptyClick);
    document.querySelector('#new-street-last').addEventListener('click', _onNewStreetLastClick);

    window.addEventListener('storage', _onStorageChange);

    document.querySelector('#gallery-link a').addEventListener('click', _onMyStreetsClick);

    document.querySelector('#sign-out-link').addEventListener('click', _signOut);

    /*if (system.pageVisibility) {
      document.addEventListener('visibilitychange', _onVisibilityChange, false);
      document.addEventListener('webkitvisibilitychange', _onVisibilityChange, false);
      document.addEventListener('mozvisibilitychange', _onVisibilityChange, false);
      document.addEventListener('msvisibilitychange', _onVisibilityChange, false);
    }*/
    window.addEventListener('focus', _onWindowFocus);
    window.addEventListener('blur', _onWindowBlur);

    window.addEventListener('beforeunload', _onWindowBeforeUnload);

    document.querySelector('#street-name').addEventListener('click', _askForStreetName);

    document.querySelector('#undo').addEventListener('click', _undo);
    document.querySelector('#redo').addEventListener('click', _redo);

    document.querySelector('#street-width').
        addEventListener('change', _onStreetWidthChange);

    window.addEventListener('resize', _onResize);

    if (!system.touch) {
      window.addEventListener('mousedown', _onBodyMouseDown);
      window.addEventListener('mousemove', _onBodyMouseMove);
      window.addEventListener('mouseup', _onBodyMouseUp); 
    } else {
      window.addEventListener('touchstart', _onBodyMouseDown);
      window.addEventListener('touchmove', _onBodyMouseMove);
      window.addEventListener('touchend', _onBodyMouseUp); 
    }
    window.addEventListener('keydown', _onBodyKeyDown);  

    document.querySelector('#share-menu-button').
        addEventListener('click', _onShareMenuClick);
    document.querySelector('#feedback-menu-button').
        addEventListener('click', _onFeedbackMenuClick);
    if (document.querySelector('#identity-menu-button')) {
      document.querySelector('#identity-menu-button').
          addEventListener('click', _onIdentityMenuClick);
    }
  }

  function _detectEnvironment() {
    var url = location.href;

    system.apiUrl = API_URL
    document.body.classList.add('environment-{{env}}');
  }

  function _detectSystemCapabilities() {
    _detectEnvironment();

    system.touch = Modernizr.touch;
    system.hiDpi = window.devicePixelRatio;
    system.pageVisibility = Modernizr.pagevisibility;

    if (system.touch) {
      document.body.classList.add('touch-support');
    }

    system.cssTransform = false;
    var el = document.createElement('div');
    for (var i in CSS_TRANSFORMS) {
      if (typeof el.style[CSS_TRANSFORMS[i]] != 'undefined') {
        system.cssTransform = CSS_TRANSFORMS[i];
        break;
      }
    }

    // TODO temporary ban
    if ((navigator.userAgent.indexOf('Opera') != -1) || (navigator.userAgent.indexOf('Internet Explorer') != -1)) {
      mode = MODE_UNSUPPORTED_BROWSER;
      _processMode();
    }
  }

  var _noConnectionMessage = {
    visible: false,
    timerId: -1,

    schedule: function() {
      if (_noConnectionMessage.timerId == -1) {
        // TODO const
        _noConnectionMessage.timerId = 
          window.setTimeout(_noConnectionMessage.show, NO_CONNECTION_MESSAGE_TIMEOUT);
      }
    },

    show: function() {
      document.querySelector('#no-connection-message').classList.add('visible');
      document.body.classList.add('no-connection-message-visible');
    },

    hide: function() {
      window.clearTimeout(_noConnectionMessage.timerId);
      _noConnectionMessage.timerId = -1;

      document.querySelector('#no-connection-message').classList.remove('visible');
      document.body.classList.remove('no-connection-message-visible');
    }
  };

  var _statusMessage = {
    timerId: -1,

    show: function(text, undo) {
      window.clearTimeout(_statusMessage.timerId);

      document.querySelector('#status-message > div').innerHTML = text;

      if (undo) {
        var buttonEl = document.createElement('button');
        buttonEl.innerHTML = msg('BUTTON_UNDO');
        buttonEl.addEventListener('click', _undo);
        document.querySelector('#status-message > div').appendChild(buttonEl);
      }

      var el = document.createElement('button');
      el.classList.add('close');
      el.addEventListener('click', _statusMessage.hide);
      el.innerHTML = '×';
      document.querySelector('#status-message > div').appendChild(el);      

      document.querySelector('#status-message').classList.add('visible');

      _statusMessage.timerId = 
          window.setTimeout(_statusMessage.hide, STATUS_MESSAGE_HIDE_DELAY);
    },

    hide: function() {
      document.querySelector('#status-message').classList.remove('visible');
    }
  };


  function _isUndoAvailable() {
    // Don’t allow undo/redo unless you own the street

    return (undoPosition > 0) && !remixOnFirstEdit;
  }

  function _isRedoAvailable() {
    // Don’t allow undo/redo unless you own the street

    return (undoPosition < undoStack.length - 1) && !remixOnFirstEdit;
  }

  function _updateUndoButtons() {
    document.querySelector('#undo').disabled = !_isUndoAvailable();
    document.querySelector('#redo').disabled = !_isRedoAvailable();
  }

  function _hideLoadingScreen() {
    document.querySelector('#loading').classList.add('hidden');
  }

  function _hideMenus() {
    _loseAnyFocus();

    document.querySelector('#share-menu').classList.remove('visible');
    document.querySelector('#feedback-menu').classList.remove('visible');
    document.querySelector('#identity-menu').classList.remove('visible');
  }

  function _prepareFeedbackForm() {
    document.querySelector('#feedback-form-message').focus();
    
    var message = window.localStorage[LOCAL_STORAGE_FEEDBACK_BACKUP] || '';
    document.querySelector('#feedback-form-message').value = message;

    var email = window.localStorage[LOCAL_STORAGE_FEEDBACK_EMAIL_BACKUP] || '';
    document.querySelector('#feedback-form-email').value = email;

    _updateFeedbackForm();

    document.querySelector('#feedback-form .loading').classList.remove('visible');
    document.querySelector('#feedback-form .thank-you').classList.remove('visible');
  }

  function _onFeedbackMenuClick() {
    var el = document.querySelector('#feedback-menu');

    if (!el.classList.contains('visible')) {
      el.classList.add('visible');

      _prepareFeedbackForm();
    } else {
      _hideMenus();
    }
  }

  function _onShareMenuClick() {
    var el = document.querySelector('#share-menu');

    if (!el.classList.contains('visible')) {
      el.classList.add('visible');

      document.querySelector('#share-via-link').focus();
      document.querySelector('#share-via-link').select();
    } else {
      _hideMenus();
    }
  }

  function _onIdentityMenuClick() {
    var el = document.querySelector('#identity-menu');

    if (!el.classList.contains('visible')) {

      var pos = _getElAbsolutePos(document.querySelector('#identity'));
      el.style.left = pos[0] + 'px';

      el.classList.add('visible');
    } else {
      _hideMenus();
    }
  }

  function _mergeAndFillDefaultSettings(secondSettings) {
    // Merge with local settings

    if (!settings.newStreetPreference) {
      settings.newStreetPreference = secondSettings.newStreetPreference;
    }
    if (typeof settings.lastStreetId === 'undefined') {
      settings.lastStreetId = secondSettings.lastStreetId;
    }
    if (typeof settings.lastStreetNamespacedId === 'undefined') {
      settings.lastStreetNamespacedId = secondSettings.lastStreetNamespacedId;
    }
    if (typeof settings.lastStreetCreatorId === 'undefined') {
      settings.lastStreetCreatorId = secondSettings.lastStreetCreatorId;
    }

    // Provide defaults if the above failed

    if (!settings.newStreetPreference) {
      settings.newStreetPreference = NEW_STREET_DEFAULT;
    }
    if (typeof settings.lastStreetId === 'undefined') {
      settings.lastStreetId = null;
    }
    if (typeof settings.lastStreetNamespacedId === 'undefined') {
      settings.lastStreetNamespacedId = null;
    }
    if (typeof settings.lastStreetCreatorId === 'undefined') {
      settings.lastStreetCreatorId = null;
    }
  }

  function _loadSettings() {
    if (signedIn && signInData.details) {
      var serverSettings = signInData.details.data;
    } else {
      var serverSettings = {};
    }

    // TODO handle better if corrupted
    if (window.localStorage[LOCAL_STORAGE_SETTINGS_ID]) {
      var localSettings = JSON.parse(window.localStorage[LOCAL_STORAGE_SETTINGS_ID]);
    } else {
      var localSettings = {};
    }

    //console.log('server settings', serverSettings);
    //console.log('local settings', localSettings);

    settings = {};

    if (serverSettings) {
      settings = serverSettings;
    } 
    _mergeAndFillDefaultSettings(localSettings);

    if (mode == MODE_JUST_SIGNED_IN) {
      //console.log('just signed in!');
      settings.lastStreetId = localSettings.lastStreetId;
      settings.lastStreetNamespacedId = localSettings.lastStreetNamespacedId;
      settings.lastStreetCreatorId = localSettings.lastStreetCreatorId;
    }

    settings.priorLastStreetId = settings.lastStreetId;

    //console.log('FINAL settings', settings);

    _saveSettingsLocally();
  }

  function _trimSettings() {
    var data = {};

    data.lastStreetId = settings.lastStreetId;
    data.lastStreetNamespacedId = settings.lastStreetNamespacedId;
    data.lastStreetCreatorId = settings.lastStreetCreatorId;

    data.newStreetPreference = settings.newStreetPreference;

    return data;
  }

  function _saveSettingsLocally() {
    //console.log('save settings', JSON.stringify(_trimSettings()));
    window.localStorage[LOCAL_STORAGE_SETTINGS_ID] = 
        JSON.stringify(_trimSettings());

    _scheduleSavingSettingsToServer();  
  }

  function _normalizeAllSegmentWidths() {
    for (var i in street.segments) {
      street.segments[i].width = 
          _normalizeSegmentWidth(street.segments[i].width, RESIZE_TYPE_INITIAL);
    }
  }

  function _updateUnits(newUnits) {
    if (street.units == newUnits) {
      return;
    }

    units = newUnits;
    street.units = newUnits;

    // If the user converts and then straight converts back, we just reach
    // to undo stack instead of double conversion (which could be lossy).
    if (undoStack[undoPosition - 1] && 
        (undoStack[undoPosition - 1].units == newUnits)) {
      var fromUndo = true;
    } else {
      var fromUndo = false;
    }

    _propagateUnits();

    ignoreStreetChanges = true;
    if (!fromUndo) {
      _normalizeAllSegmentWidths();

      if (street.remainingWidth == 0) {
        street.width = 0;
        for (var i in street.segments) {
          street.width += street.segments[i].width;
        }
      } else {
        street.width = _normalizeStreetWidth(street.width);
      }
    } else {
      street = _clone(undoStack[undoPosition - 1]);
    }
    _createDomFromData();
    _segmentsChanged();
    _resizeStreetWidth();

    ignoreStreetChanges = false;      

    _buildStreetWidthMenu();
    _hideMenus();

    _saveStreetToServerIfNecessary();
    _saveSettingsLocally();
  }

  function _propagateUnits() {
    switch (street.units) {
      case SETTINGS_UNITS_IMPERIAL:
        segmentWidthResolution = SEGMENT_WIDTH_RESOLUTION_IMPERIAL;
        segmentWidthClickIncrement = SEGMENT_WIDTH_CLICK_INCREMENT_IMPERIAL;
        segmentWidthDraggingResolution = 
            SEGMENT_WIDTH_DRAGGING_RESOLUTION_IMPERIAL;
        break;
      case SETTINGS_UNITS_METRIC:
        segmentWidthResolution = SEGMENT_WIDTH_RESOLUTION_METRIC;
        segmentWidthClickIncrement = SEGMENT_WIDTH_CLICK_INCREMENT_METRIC;
        segmentWidthDraggingResolution = 
            SEGMENT_WIDTH_DRAGGING_RESOLUTION_METRIC;
        break;
    }

    _buildStreetWidthMenu();
  }

  function _getPageTitle() {
    return street.name + '– Streetmix';
  }

  function _getSharingMessage() {
    var message = '';

    if (signedIn) {
      if (!street.creatorId) {
        message = 'Check out ' + street.name + ' street on Streetmix!';
      } else if (street.creatorId == signInData.userId) {
        message = 'Check out my street, ' + street.name + ', on Streetmix!';
      } else {
        message = 'Check out ' + street.name + ' street by @' + street.creatorId + ' on Streetmix!';
      }
    } else {
      message = 'Check out ' + street.name + ' street on Streetmix!';
    }

    return message;
  }

  function _updateFacebookLink(url) {
    var el = document.querySelector('#share-via-facebook');

    var text = _getSharingMessage();

    var appId = FACEBOOK_APP_ID;

    // TODO const
    el.href = 'https://www.facebook.com/dialog/feed' +
        '?app_id=' + encodeURIComponent(appId) +
        '&redirect_uri=' + encodeURIComponent(url) + 
        '&link=' + encodeURIComponent(url) + 
        '&name=' + encodeURIComponent(_getPageTitle()) +
        '&description=' + encodeURIComponent(htmlEncode(text));
  }

  function _updateTwitterLink(url) {
    var el = document.querySelector('#share-via-twitter');

    var text = _getSharingMessage();

    // TODO const
    el.href = 'https://twitter.com/intent/tweet' + 
        '?text=' + encodeURIComponent(text) + 
        '&url=' + encodeURIComponent(url);
  }

  function _updateNakedLink(url) {
    document.querySelector('#share-via-link').value = url;
  }

  function _getSharingUrl() {
    var url = location.href;

    return url;
  }

  function _updateShareMenu() {
    var url = _getSharingUrl();

    _updateNakedLink(url);
    _updateTwitterLink(url);
    _updateFacebookLink(url);

    if (!signedIn) {
      document.querySelector('#sign-in-promo').classList.add('visible');
    }
  }

  function _updateFeedbackMenu() {
    var el = document.querySelector('#feedback-via-twitter');

    var text = TWITTER_ID;
    var url = _getSharingUrl();

    // TODO const
    el.href = 'https://twitter.com/intent/tweet' + 
        '?text=' + encodeURIComponent(text) + 
        '&url=' + encodeURIComponent(url);    
  }

  function _prepareDefaultStreet() {
    street.units = units;
    _propagateUnits();
    street.name = DEFAULT_NAME;
    street.width = _normalizeStreetWidth(DEFAULT_STREET_WIDTH);
    if (signedIn) {
      _setStreetCreatorId(signInData.userId);
    }

    _fillDefaultSegments();    

    _setUpdateTimeToNow();
  }

  function _prepareEmptyStreet() {
    street.units = units;
    _propagateUnits();

    street.name = DEFAULT_NAME;
    street.width = _normalizeStreetWidth(DEFAULT_STREET_WIDTH);
    if (signedIn) {
      _setStreetCreatorId(signInData.userId);
    }

    street.segments = [];

    _setUpdateTimeToNow();
  }

  function _onScrollButtonLeft(event) {
    var el = event.target.el;
    // TODO const
    $(el).animate({ scrollLeft: el.scrollLeft - (el.offsetWidth - 150) }, 300);
  }

  function _onScrollButtonRight(event) {
    var el = event.target.el;

    // TODO const
    $(el).animate({ scrollLeft: el.scrollLeft + (el.offsetWidth - 150) }, 300);
  }

  function _onScrollButtonScroll(event) {
    _scrollButtonScroll(event.target);
  }

  function _scrollButtonScroll(el) {
    if (el.scrollLeft == 0) {
      el.parentNode.querySelector('button.scroll-left').disabled = true;
    } else {
      el.parentNode.querySelector('button.scroll-left').disabled = false;      
    }

    if (el.scrollLeft == el.scrollWidth - el.offsetWidth) {
      el.parentNode.querySelector('button.scroll-right').disabled = true;
    } else {
      el.parentNode.querySelector('button.scroll-right').disabled = false;      
    }
  }

  function _repositionScrollButtons(el) {
    var buttonEl = el.parentNode.querySelector('button.scroll-left');
    buttonEl.style.left = _getElAbsolutePos(el)[0] + 'px';

    var buttonEl = el.parentNode.querySelector('button.scroll-right');
    buttonEl.style.left = (_getElAbsolutePos(el)[0] + el.offsetWidth) + 'px';
  }

  function _addScrollButtons(el) {
    var buttonEl = document.createElement('button');
    buttonEl.innerHTML = '«';
    buttonEl.classList.add('scroll-left');
    buttonEl.el = el;
    buttonEl.addEventListener('click', _onScrollButtonLeft);
    el.parentNode.appendChild(buttonEl);

    var buttonEl = document.createElement('button');
    buttonEl.innerHTML = '»';
    buttonEl.classList.add('scroll-right');
    buttonEl.el = el;
    buttonEl.addEventListener('click', _onScrollButtonRight);
    el.parentNode.appendChild(buttonEl);

    el.setAttribute('scroll-buttons', true);
    el.addEventListener('scroll', _onScrollButtonScroll);

    _repositionScrollButtons(el);
    _scrollButtonScroll(el);
  }

  function _onEverythingLoaded() {
    switch (mode) {
      case MODE_NEW_STREET:
        _showNewStreetMenu();
        break;
      case MODE_NEW_STREET_COPY_LAST:
        _onNewStreetLastClick();
        break;
    }

    _resizeStreetWidth();
    _updateStreetName();
    _createPalette();
    _createDomFromData();
    _segmentsChanged();
    _updateShareMenu();
    _updateFeedbackMenu();

    initializing = false;    
    ignoreStreetChanges = false;
    lastStreet = _trimStreetData(street);

    _updatePageUrl();
    _buildStreetWidthMenu();
    _onResize();
    _addScrollButtons(document.querySelector('#palette'));
    _addScrollButtons(document.querySelector('#gallery .streets'));
    _addEventListeners();

    if (mode == MODE_USER_GALLERY) {
      _showGallery(galleryUserId, true);
    } else if (mode == MODE_GLOBAL_GALLERY) {
      _showGallery(null, true);
    }

    window.setTimeout(_hideLoadingScreen, 0);

    if (promoteStreet) {
      //console.log('would promote now');
      _remixStreet();
    }
  }

  function _checkIfEverythingIsLoaded() {
    if (abortEverything) {
      return;
    }

    if ((imagesToBeLoaded == 0) && signInLoaded && bodyLoaded && 
        readyStateCompleteLoaded && countryLoaded && serverContacted) {
      _onEverythingLoaded();
    }
  }

  function _onImageLoaded() {
    imagesToBeLoaded--;

    _checkIfEverythingIsLoaded();
  }

  function _loadImages() {
    imagesToBeLoaded = IMAGES_TO_BE_LOADED.length;

    for (var i in IMAGES_TO_BE_LOADED) {
      var url = IMAGES_TO_BE_LOADED[i];
      images[url] = document.createElement('img');
      images[url].addEventListener('load', _onImageLoaded);
      images[url].src = url + '?v' + TILESET_IMAGE_VERSION;
    }    
  }

  function _saveSignInDataLocally() {
    if (signInData) {
      window.localStorage[LOCAL_STORAGE_SIGN_IN_ID] = JSON.stringify(signInData);
    } else {
      window.localStorage[LOCAL_STORAGE_SIGN_IN_ID] = '';
    }
  }

  function _removeSignInCookies() {
    $.removeCookie(SIGN_IN_TOKEN_COOKIE);
    $.removeCookie(USER_ID_COOKIE);
  }

  function _loadSignIn() {
    signInLoaded = false;

    var signInCookie = $.cookie(SIGN_IN_TOKEN_COOKIE);
    var userIdCookie = $.cookie(USER_ID_COOKIE);

    if (signInCookie && userIdCookie) {
      signInData = { token: signInCookie, userId: userIdCookie };

      _removeSignInCookies();
      _saveSignInDataLocally();
    } else {
      if (window.localStorage[LOCAL_STORAGE_SIGN_IN_ID]) {
        signInData = JSON.parse(window.localStorage[LOCAL_STORAGE_SIGN_IN_ID]);
      }
    }

    if (signInData && signInData.token && signInData.userId) {
      _fetchSignInDetails();

      // This block was commented out because caching username causes 
      // failures when the database is cleared. TODO Perhaps we should
      // be handling this more deftly.
      /*if (signInData.details) {
        signedIn = true;
        _signInLoaded();
      } else {
        _fetchSignInDetails();
      }*/

    } else {
      signedIn = false;
      _signInLoaded();
    }
  }

  function _fetchSignInDetails() {
    // TODO const
    jQuery.ajax({
      url: system.apiUrl + 'v1/users/' + signInData.userId,
      dataType: 'json',
      headers: { 'Authorization': _getAuthHeader() }
    }).done(_receiveSignInDetails).fail(_errorReceiveSignInDetails);

    //console.log(system.apiUrl + 'v1/users/' + signInData.userId);
  }

  function _receiveSignInDetails(details) {
    //console.log('receive sign in details', details);

    signInData.details = details;
    _saveSignInDataLocally();

    _receiveAvatar(details);

    signedIn = true;
    _signInLoaded();
  }

  function _errorReceiveSignInDetails(data) {   
    // If we get data.status == 0, it means that the user opened the page and
    // closed is quickly, so the request was aborted. We choose to do nothing
    // instead of clobbering sign in data below and effectively signing the
    // user out. Issue #302.

    // It also, unfortunately, might mean regular server failure, too. Marcin
    // doesn’t know what to do with it yet. Open issue #339.

    console.log(data);

    /*if (data.status == 0) {
      _showError(ERROR_NEW_STREET_SERVER_FAILURE, true);
      return;
    }*/

    // Fail silently

    signInData = null;
    //_saveSignInDataLocally();

    signedIn = false;
    _signInLoaded();
  }

  function _signOut(event) {
    settings.lastStreetId = null;
    settings.lastStreetNamespacedId = null;
    settings.lastStreetCreatorId = null;
    _saveSettingsLocally();

    _removeSignInCookies();
    window.localStorage.removeItem(LOCAL_STORAGE_SIGN_IN_ID);
    _sendSignOutToServer();

    event.preventDefault();
  }

  function _getAuthHeader() {
    if (signInData && signInData.token) {
      return 'Streetmix realm="" loginToken="' + signInData.token + '"'
    } else {
      return '';
    }
  }

  function _sendSignOutToServer() {
    jQuery.ajax({
      // TODO const
      url: system.apiUrl + 'v1/users/' + signInData.userId + '/login-token',
      dataType: 'json',
      type: 'DELETE',
      headers: { 'Authorization': _getAuthHeader() }
    }).done(_receiveSignOutConfirmationFromServer)
    .fail(_errorReceiveSignOutConfirmationFromServer);
  }

    function _receiveSignOutConfirmationFromServer() {
      mode = MODE_SIGN_OUT;
      _processMode();
    }

    function _errorReceiveSignOutConfirmationFromServer() {
    mode = MODE_SIGN_OUT;
    _processMode();
  }

  function _createSignInUI() {
    if (signedIn) {
      var el = document.createElement('div');
      //el.style.backgroundImage = 'url(' + signInData.details.profileImageUrl + ')';
      el.classList.add('avatar');
      el.setAttribute('userId', signInData.userId);
      document.querySelector('#identity').appendChild(el);

      var el = document.createElement('button');
      el.innerHTML = signInData.userId;
      el.classList.add('id');
      el.id = 'identity-menu-button';
      document.querySelector('#identity').appendChild(el);

      document.querySelector('#identity').classList.add('visible');

      document.querySelector('#gallery-link').classList.add('visible');

      _fetchAvatars();
    } else {
      var el = document.createElement('a');
      el.href = '/' + URL_SIGN_IN_REDIRECT;
      el.classList.add('command');
      el.innerHTML = 'Sign in';
      document.querySelector('#sign-in-link').appendChild(el);

      document.querySelector('#identity').classList.remove('visible');
    }
  }

  function _signInLoaded() {
    _loadSettings();

    _createSignInUI();

    if ((mode == MODE_CONTINUE) || (mode == MODE_JUST_SIGNED_IN) || 
        (mode == MODE_USER_GALLERY) || (mode == MODE_GLOBAL_GALLERY)) {
      //console.log('inside', mode == MODE_JUST_SIGNED_IN);
      if (settings.lastStreetId) {
        //console.log('further inside…');
        street.creatorId = settings.lastStreetCreatorId;
        street.id = settings.lastStreetId;
        street.namespacedId = settings.lastStreetNamespacedId;

        //console.log('!');
        //console.log(mode == MODE_JUST_SIGNED_IN);
        //console.log(street);

        if ((mode == MODE_JUST_SIGNED_IN) && (!street.creatorId)) {
          promoteStreet = true;
          //console.log('promoting!');
        }
        
        if (mode == MODE_JUST_SIGNED_IN) {
          mode = MODE_CONTINUE;
        }
      } else {
        mode = MODE_NEW_STREET;
      }
    }

    switch (mode) {
      case MODE_NEW_STREET:
      case MODE_NEW_STREET_COPY_LAST:
        _createNewStreetOnServer();
        break;
      case MODE_EXISTING_STREET:
      case MODE_CONTINUE:
      case MODE_USER_GALLERY:
      case MODE_GLOBAL_GALLERY:
        _fetchStreetFromServer();
        break;
    }

    if (signedIn) {
      document.querySelector('#gallery-link a').href = '/' + signInData.userId;
    }

    signInLoaded = true;
    _checkIfEverythingIsLoaded();
  }

  function _detectCountry() {
    countryLoaded = false;

    $.ajax({ url: IP_GEOCODING_API_URL }).done(_receiveCountry);

    window.setTimeout(_detectCountryTimeout, IP_GEOCODING_TIMEOUT);
  }

  function _detectCountryTimeout() {
    if (!countryLoaded) {
      countryLoaded = true;
      _checkIfEverythingIsLoaded();
    }
  }

  function _receiveCountry(info) {
    if (countryLoaded) {
      // Already loaded, discard results
      return;
    }

    if (info && info.country_code) {
      if (COUNTRIES_IMPERIAL_UNITS.indexOf(info.country_code) != -1) {
        units = SETTINGS_UNITS_IMPERIAL;
      } else {
        units = SETTINGS_UNITS_METRIC;
      }

      if (COUNTRIES_LEFT_HAND_TRAFFIC.indexOf(info.country_code) != -1) {
        leftHandTraffic = true;
      }
    }

    if (info && info.ip) {
      system.ipAddress = info.ip;
    }

    countryLoaded = true;
    _checkIfEverythingIsLoaded();
  }

  function _onBodyLoad() {
    bodyLoaded = true;

    _checkIfEverythingIsLoaded();
  }

  function _onReadyStateChange() {
    if (document.readyState == 'complete') {
      readyStateCompleteLoaded = true;

      _checkIfEverythingIsLoaded();
    }
  }

  function _processUrl() {
    var url = location.pathname;

    // Remove heading slash
    if (!url) {
      url = '/';
    }
    url = url.substr(1);

    // Remove trailing slashes
    url = url.replace(/\/+$/, '');

    var urlParts = url.split(/\//);

    if (!url) {
      // Continue where we left off… or start with a default (demo) street

      mode = MODE_CONTINUE;
    } else if ((urlParts.length == 1) && (urlParts[0] == URL_NEW_STREET)) {
      // New street

      mode = MODE_NEW_STREET;
    } else if ((urlParts.length == 1) && (urlParts[0] == URL_NEW_STREET_COPY_LAST)) {
      // New street (but start with copying last street)

      mode = MODE_NEW_STREET_COPY_LAST;
    } else if ((urlParts.length == 1) && (urlParts[0] == URL_JUST_SIGNED_IN)) {
      // Coming back from a successful sign in

      mode = MODE_JUST_SIGNED_IN;
    } else if ((urlParts.length >= 1) && (urlParts[0] == URL_ERROR)) {
      // Error

      mode = MODE_ERROR;
      errorUrl = urlParts[1];

    } else if ((urlParts.length == 1) && (urlParts[0] == URL_GLOBAL_GALLERY)) {
      // Global gallery

      mode = MODE_GLOBAL_GALLERY;
    } else if ((urlParts.length == 1) && urlParts[0]) {
      // User gallery

      galleryUserId = urlParts[0];

      mode = MODE_USER_GALLERY;
    } else if ((urlParts.length == 2) && (urlParts[0] == URL_NO_USER) && urlParts[1]) {
      // TODO add is integer urlParts[1];
      // Existing street by an anonymous person

      street.creatorId = null;
      street.namespacedId = urlParts[1];

      mode = MODE_EXISTING_STREET;
    } else if ((urlParts.length >= 2) && urlParts[0] && urlParts[1]) {
      // TODO add is integer urlParts[1];
      // Existing street by a signed in person

      street.creatorId = urlParts[0];

      if (street.creatorId.charAt(0) == URL_RESERVED_PREFIX) {
        street.creatorId = street.creatorId.substr(1);
      }

      street.namespacedId = urlParts[1];

      mode = MODE_EXISTING_STREET;
    } else {
      mode = MODE_404;

      // 404: bad URL
    }
  }

  function _createNewStreetOnServer() {
    if (settings.newStreetPreference == NEW_STREET_EMPTY) {
      _prepareEmptyStreet();
    } else {
      _prepareDefaultStreet();
    }

    var transmission = _packServerStreetData();    

    jQuery.ajax({
      // TODO const
      url: system.apiUrl + 'v1/streets',
      data: transmission,
      type: 'POST',
      dataType: 'json',
      headers: { 'Authorization': _getAuthHeader() }
    }).done(_receiveNewStreet)
    .fail(_errorReceiveNewStreet);
  }

  function _receiveNewStreet(data) {
    //console.log('received new street', data);

    _setStreetId(data.id, data.namespacedId);

    _saveStreetToServer(true);
  }

  function _errorReceiveNewStreet(data) {
    //console.log('failed new street!');

    _showError(ERROR_NEW_STREET_SERVER_FAILURE, true);
  }

  function _getFetchStreetUrl() {
    // TODO const
    if (street.creatorId) {
      var url = system.apiUrl + 'v1/streets?namespacedId=' + 
          encodeURIComponent(street.namespacedId) + '&creatorId=' +
          encodeURIComponent(street.creatorId);
    } else {
      var url = system.apiUrl + 'v1/streets?namespacedId=' + 
          encodeURIComponent(street.namespacedId);    
    }

    return url;    
  }

  function _fetchStreetFromServer() {
    var url = _getFetchStreetUrl();

    console.log('URL', url);

    jQuery.ajax({
      url: url,
      dataType: 'json',
      type: 'GET',
    }).done(_receiveStreet).fail(_errorReceiveStreet);
  }

  function _updateAvatars() {
    var els = document.querySelectorAll('.avatar:not([loaded])');

    for (var i = 0, el; el = els[i]; i++) {
      var userId = el.getAttribute('userId');

      if (avatarCache[userId]) {
        console.log('AVATAR updated', userId);
        el.style.backgroundImage = 'url(' + avatarCache[userId] + ')';
        el.setAttribute('loaded', true);
      }
    }
  }

  function _fetchAvatars() {
    var els = document.querySelectorAll('.avatar:not([loaded])');

    for (var i = 0, el; el = els[i]; i++) {
      var userId = el.getAttribute('userId');

      if (userId && (typeof avatarCache[userId] == 'undefined')) {
        console.log('AVATAR trying to fetch', userId);

        _fetchAvatar(userId);
      }
    }

    _updateAvatars();
  }

  function _fetchAvatar(userId) {
    avatarCache[userId] = null;
  
    jQuery.ajax({
      dataType: 'json',
      url: system.apiUrl + 'v1/users/' + userId
    }).done(_receiveAvatar);
  }

  function _receiveAvatar(details) {
    console.log(details);
    if (details && details.id && details.profileImageUrl) {
      console.log('AVATAR receive', details.id);
      avatarCache[details.id] = details.profileImageUrl;
      _updateAvatars();
    }
  }

  function _errorReceiveStreet(data) {
    if ((mode == MODE_CONTINUE) || (mode == MODE_USER_GALLERY) || 
        (mode == MODE_GLOBAL_GALLERY)) {
      //console.log('ERROR', data);
      //abortEverything = true;
      
      _goNewStreet();
    } else {
      if (data.status == 404) {
        // TODO swap for showError (here and elsewhere)
        mode = MODE_404;
        _processMode();
      } else {
        console.log('_errorReceiveStreet:', data.status);
        _showError(ERROR_NEW_STREET_SERVER_FAILURE, true);
      }
    }
  }

  function _goReloadClearSignIn() {
    signInData = null;
    _saveSignInDataLocally();
    _removeSignInCookies();

    location.reload();
  }

  function _goReload() {
    location.reload();
  }

  function _goHome() {
    location.href = '/';
  }

  function _goSignIn() {
    location.href = '/' + URL_SIGN_IN_REDIRECT;
  }

  function _goNewStreet() {
    location.href = '/' + URL_NEW_STREET;
  }

  function _goCopyLastStreet() {
    location.href = '/' + URL_NEW_STREET_COPY_LAST;
  }

  function _showError(errorType, newAbortEverything) {
    var title = '';
    var description = '';

    abortEverything = newAbortEverything;

    switch (errorType) {
      case ERROR_404:
        title = 'Page not found.';
        description = 'Oh, boy. There is no page with this address!<br><button class="home">Go to the homepage</button>';
        // TODO go to homepage
        break;
      case ERROR_SIGN_OUT:
        title = 'You are now signed out.';
        description = '<button class="sign-in">Sign in again</button> <button class="home">Go to the homepage</button>';
        break;
      case ERROR_NO_STREET:
        title = 'No street selected.';
        break;
      case ERROR_FORCE_RELOAD_SIGN_OUT:
        title = 'You signed out in another window.';
        description = 'Please reload this page before continuing.<br><button class="reload">Reload the page</button>';
        break;
      case ERROR_FORCE_RELOAD_SIGN_OUT_401:
        title = 'You signed out in another window.';
        description = 'Please reload this page before continuing.<br>(Error 401)<br><button class="clear-sign-in-reload">Reload the page</button>';
        break;
      case ERROR_FORCE_RELOAD_SIGN_IN:
        title = 'You signed in in another window.';
        description = 'Please reload this page before continuing.<br><button class="reload">Reload the page</button>';
        break;
      case ERROR_STREET_DELETED_ELSEWHERE:
        title = 'This street has been deleted elsewhere.';
        description = 'This street has been deleted in another browser.<br><button class="home">Go to the homepage</button>';
        break;
      case ERROR_NEW_STREET_SERVER_FAILURE:
        title = 'Having trouble…';
        description = 'We’re having trouble loading Streetmix.<br><button class="new">Try again</button>';
        break;
      case ERROR_TWITTER_ACCESS_DENIED:
        title = 'You are not signed in.';
        description = 'You cancelled the Twitter sign in process.<br><button class="home">Go to the homepage</button>';
        break;
      case ERROR_AUTH_PROBLEM_NO_TWITTER_REQUEST_TOKEN:
      case ERROR_AUTH_PROBLEM_NO_TWITTER_ACCESS_TOKEN:
      case ERROR_AUTH_PROBLEM_API_PROBLEM:
        title = 'There was a problem with signing you in.';
        // TODO const for feedback
        description = 'There was a problem with Twitter authentication. Please try again later or let us know via <a target="_blank" href="mailto:streetmix@codeforamerica.org">email</a> or <a target="_blank" href="https://twitter.com/intent/tweet?text=@streetmixapp">Twitter</a>.<br><button class="home">Go to the homepage</button>';
        break;
      case ERROR_GENERIC_ERROR:
        title = 'Something went wrong.';
        // TODO const for feedback
        description = 'We’re sorry – something went wrong. Please try again later or let us know via <a target="_blank" href="mailto:streetmix@codeforamerica.org">email</a> or <a target="_blank" href="https://twitter.com/intent/tweet?text=@streetmixapp">Twitter</a>.<br><button class="home">Go to the homepage</button>';
        break;
      case ERROR_UNSUPPORTED_BROWSER:
        title = 'Streetmix doesn’t work on your browser.';
        // TODO const for feedback
        description = 'Sorry about that. You might want to try <a target="_blank" href="http://www.google.com/chrome">Chrome</a>, <a target="_blank" href="http://www.mozilla.org/firefox">Firefox</a>, or Safari. If you think your browser should be supported, let us know via <a target="_blank" href="mailto:streetmix@codeforamerica.org">email</a> or <a target="_blank" href="https://twitter.com/intent/tweet?text=@streetmixapp">Twitter</a>.';
        break;
    }

    document.querySelector('#error h1').innerHTML = title;
    document.querySelector('#error .description').innerHTML = description;

    var el = document.querySelector('#error .home');
    if (el) {
      el.addEventListener('click', _goHome);
    }

    var el = document.querySelector('#error .sign-in');
    if (el) {
      el.addEventListener('click', _goSignIn);
    }

    var el = document.querySelector('#error .reload');
    if (el) {
      el.addEventListener('click', _goReload);
    }

    var el = document.querySelector('#error .clear-sign-in-reload');
    if (el) {
      el.addEventListener('click', _goReloadClearSignIn);
    }

    var el = document.querySelector('#error .new');
    if (el) {
      el.addEventListener('click', _goNewStreet);
    }

    document.querySelector('#error').classList.add('visible');

    currentErrorType = errorType;
  }

  function _hideError() {
    document.querySelector('#error').classList.remove('visible');    

    currentErrorType = null;
  }

  function _showErrorFromUrl() {
    // TODO const
    switch (errorUrl) {
      case 'twitter-access-denied':
        var errorType = ERROR_TWITTER_ACCESS_DENIED;
        break;
      case 'no-twitter-request-token':
        var errorType = ERROR_AUTH_PROBLEM_NO_TWITTER_REQUEST_TOKEN;
        break;
      case 'no-twitter-access-token':
        var errorType = ERROR_AUTH_PROBLEM_NO_TWITTER_ACCESS_TOKEN;
        break;
      case 'authentication-api-problem':
        var errorType = ERROR_AUTH_PROBLEM_API_PROBLEM;
        break;
      default:
        var errorType = ERROR_GENERIC_ERROR;
        break;
    }

    _showError(errorType, true);
  }

  function _processMode() {
    serverContacted = true;

    switch (mode) {
      case MODE_ERROR:
        _showErrorFromUrl();
        break;
      case MODE_UNSUPPORTED_BROWSER:
        _showError(ERROR_UNSUPPORTED_BROWSER, true);
        break;
      case MODE_404:
        _showError(ERROR_404, true);
        break;
      case MODE_SIGN_OUT:
        _showError(ERROR_SIGN_OUT, true);
        break;
      case MODE_FORCE_RELOAD_SIGN_OUT:
        _showError(ERROR_FORCE_RELOAD_SIGN_OUT, true);
        break;
      case MODE_FORCE_RELOAD_SIGN_OUT_401:
        _showError(ERROR_FORCE_RELOAD_SIGN_OUT_401, true);
        break;
      case MODE_FORCE_RELOAD_SIGN_IN:
        _showError(ERROR_FORCE_RELOAD_SIGN_IN, true);
        break;
      case MODE_NEW_STREET:
        serverContacted = false;
        break;
      case MODE_NEW_STREET_COPY_LAST:
        serverContacted = false;
        break;
      case MODE_CONTINUE:
      case MODE_USER_GALLERY:
      case MODE_GLOBAL_GALLERY:
        serverContacted = false;
        break;
      case MODE_JUST_SIGNED_IN:
        serverContacted = false;
        break;
      case MODE_EXISTING_STREET:
        serverContacted = false;
        break;
    }
  }

  function _fillDom() {
    // TODO Instead of doing like this, put variables in the index.html, and fill
    // them out?
    $('#undo').text(msg('BUTTON_UNDO'));
    $('#redo').text(msg('BUTTON_REDO'));

    $('#trashcan').text(msg('UI_DRAG_HERE_TO_REMOVE'));
  }
 
  main.init = function() {
    initializing = true;
    ignoreStreetChanges = true;

    _fillDom();

    // Temporary as per https://github.com/Modernizr/Modernizr/issues/788#issuecomment-12513563
    Modernizr.addTest('pagevisibility', !!Modernizr.prefixed('hidden', document, false));

    // TODO make it better 
    // Related to Enter to 404 bug in Chrome
    $.ajaxSetup({ cache: false });

    readyStateCompleteLoaded = false;
    document.addEventListener('readystatechange', _onReadyStateChange);

    bodyLoaded = false;
    window.addEventListener('load', _onBodyLoad);

    _detectSystemCapabilities();

    _processUrl();
    _processMode();

    if (abortEverything) {
      return;
    }

    // Asynchronously loading…

    // …detecting country from IP for units and left/right-hand driving
    if ((mode == MODE_NEW_STREET) || (mode == MODE_NEW_STREET_COPY_LAST)) {
      _detectCountry();
    } else {
      countryLoaded = true;
    }

    // …sign in info from our API (if not previously cached) – and subsequent
    // street data if necessary (depending on the mode)
    _loadSignIn();

    // …images
    _loadImages();

    // Note that we are waiting for sign in and image info to show the page,
    // but we give up on country info if it’s more than 1000ms.
  }

  return main;
})();