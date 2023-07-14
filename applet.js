const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;

function CloudflareIndicatorApplet(orientation, panel_height, instance_id) {
  this._init(orientation, panel_height, instance_id);
}

CloudflareIndicatorApplet.prototype = {
  __proto__: Applet.IconApplet.prototype,

  _init: function (orientation, panel_height, instance_id) {
    Applet.IconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

    this.set_applet_tooltip("Manage your Cloudflare connection");

    // Create the menu
    this.menuManager = new PopupMenu.PopupMenuManager(this);
    this.menu = new Applet.AppletPopupMenu(this, orientation);
    this.menuManager.addMenu(this.menu);

    // Create the menu item
    this.menuItem = new PopupMenu.PopupMenuItem("");
    this.menu.addMenuItem(this.menuItem);
    this.menuItem.connect("activate", this._onPressMenuIcon.bind(this));

    this._updateIconAndLabel();
  },

  on_applet_clicked() {
    this.menu.toggle();
  },

  _onPressMenuIcon() {
    if (this.menuItem.label.text == Action.TurnOn.menu) {
      run(WarpCommand.DISCONNECT);
      this._doAction(Action.TurnOff);
    } else {
      run(WarpCommand.CONNECT);
      this._doAction(Action.TurnOn);
    }
  },

  _updateIconAndLabel() {
    this._checkWarpConnectionStatus() ? this._doAction(Action.TurnOn) : this._doAction(Action.TurnOff);
  },

  _checkWarpConnectionStatus() {
    const data = run(WarpCommand.STATUS);

    const statusInformation = data.split(".")[0];
    const state = statusInformation.split(":")[1].trim();

    return state === State.CONNECTED;
  },

  _doAction(action) {
    this.set_applet_icon_name(action.icon);
    this.menuItem.label.set_text(action.menu);
  },
};

function main(metadata, orientation, panel_height, instance_id) {
  return new CloudflareIndicatorApplet(orientation, panel_height, instance_id);
}

/*

  Command: warp-cli status
  Result:
    Status update: Disconnected. Reason: Manual Disconnection
    Status update: Connected

  Command: warp-cli connect

  Command: warp-cli disconnect

*/

const WarpCommand = {
  STATUS: "warp-cli status",
  CONNECT: "warp-cli connect",
  DISCONNECT: "warp-cli disconnect",
};

const State = {
  CONNECTED: "Connected",
  DISCONNECTED: "Disconnected",
};

const Action = {
  TurnOn: {
    menu: "Disconnect",
    icon: "cloudflare_on",
    command: WarpCommand.DISCONNECT,
  },
  TurnOff: {
    menu: "Connect",
    icon: "cloudflare_off",
    command: WarpCommand.CONNECT,
  },
};

function log(text) {
  global.log("LOGGING", text);
}

function run(cmd) {
  try {
    const [result, stdout, stderr] = GLib.spawn_command_line_sync(cmd);
    if (stdout !== null) {
      return stdout.toString();
    }
  } catch (error) {
    global.logError(error.message);
  }
}
