'use strict'

var libQ = require('kew')
var fs = require('fs-extra')
var config = new (require('v-conf'))()
var exec = require('child_process').exec
var execSync = require('child_process').execSync
const rfIdReader = require('./rfid-reader')

module.exports = rfidController
function rfidController(context) {
  var self = this

  this.context = context
  this.commandRouter = this.context.coreCommand
  this.logger = this.context.logger
  this.configManager = this.context.configManager
  this.lastCardId = ''
}

rfidController.prototype.onVolumioStart = function() {
  var self = this
  var configFile = this.commandRouter.pluginManager.getConfigurationFile(
    this.context,
    'config.json'
  )
  this.config = new (require('v-conf'))()
  this.config.loadFile(configFile)

  return libQ.resolve()
}

rfidController.prototype.onStart = function() {
  var self = this
  var defer = libQ.defer()

  self.logger.info('RFID CONTROLLER PLUGIN: Trying to start RFID reader')
  rfIdReader(this.onCardHasBeenFound.bind(this), this.logger)
  self.logger.info('RFID CONTROLLER PLUGIN: RFID reader started')

  // Once the Plugin has successfull started resolve the promise
  defer.resolve()

  return defer.promise
}

rfidController.prototype.onCardHasBeenFound = function(cardId) {
  if (cardId === this.lastCardId) {
    return
  }
  this.lastCardId = cardId

  const configKey = 'RFIDtoPlaylist.' + cardId
  const configuredPlaylist = this.config.get(configKey)
  if (configuredPlaylist === undefined) {
    this.config.set(configKey, '')
    this.logger.info(
      `RFID CONTROLLER PLUGIN: New RFID ID detected. Added to config. Card ID: ${cardId}`
    )
    this.commandRouter.pushToastMessage(
      'success',
      'A new RFID card has been detected',
      'You can configure the playlist to play in the plugin settings'
    )
    return
  }

  if (!configuredPlaylist) {
    this.logger.info(
      `RFID CONTROLLER PLUGIN: Card detected but no playist configured. Card ID: ${cardId}`
    )
    this.commandRouter.pushToastMessage(
      'warning',
      'No playlist configured for this RFID card',
      'You can configure the playlist in the plugin settings'
    )
    return
  }

  this.commandRouter.pushToastMessage(
    'info',
    'Playlist started from RFID event',
    `Starting playlist "${configuredPlaylist}"`
  )

  this.commandRouter.playPlaylist(configuredPlaylist)
}

rfidController.prototype.onStop = function() {
  var self = this
  var defer = libQ.defer()

  // Once the Plugin has successfull stopped resolve the promise
  defer.resolve()

  return libQ.resolve()
}

rfidController.prototype.onRestart = function() {
  var self = this
  // Optional, use if you need it
}

rfidController.prototype.getUIConfig = function() {
  const defer = libQ.defer()
  const knownRFIDcardIDs = this.config.getKeys('RFIDtoPlaylist')
  this.logger.info('RFID CONTROLLER PLUGIN: Config generated.')
  this.logger.info(
    'RFID CONTROLLER PLUGIN: Known RFID CardIDs in config: ',
    knownRFIDcardIDs
  )

  this.commandRouter.playListManager.listPlaylist().then(playlists => {
    let selectOptions = playlists.map(playlist => {
      return { value: playlist, label: playlist }
    })
    if (selectOptions.length === 0) {
      selectOptions = [{ value: '', label: 'No playlists found' }]
    }

    let sectionContent = knownRFIDcardIDs.map(cardId => {
      const associatedPlaylist =
        this.config.get('RFIDtoPlaylist.' + cardId) || ''
      return {
        id: cardId,
        type: 'text',
        element: 'select',
        doc: `The playlist that should play when you touch the RFID reader with the card ${cardId}`,
        label: `Playlist for card ID ${cardId}`,
        value: { value: associatedPlaylist, label: associatedPlaylist },
        options: selectOptions,
      }
    })

    const configObj = {
      page: {
        label: 'RFID Controller Configuration',
      },
      sections: [
        {
          id: 'playlist_config',
          element: 'section',
          label: 'Associate a playlist to a RFID ID',
          icon: 'fa-plug',
          onSave: {
            type: 'controller',
            endpoint: 'user_interface/rfid_controller',
            method: 'savePlaylistConfig',
          },
          saveButton: {
            label: 'Save',
            data: knownRFIDcardIDs,
          },
          content: sectionContent,
        },
      ],
    }

    defer.resolve(configObj)
  })
  return defer.promise
}

rfidController.prototype.savePlaylistConfig = function(data) {
  for (let cardId in data) {
    const configKey = 'RFIDtoPlaylist.' + cardId
    this.config.set(configKey, data[cardId].value)
  }
  this.logger.info('RFID CONTROLLER PLUGIN: Config saved: ', data)

  return libQ.resolve({})
}

rfidController.prototype.getConfigurationFiles = function() {
  return ['config.json']
}

rfidController.prototype.setUIConfig = function(data) {
  var self = this
  //Perform your installation tasks here
}

rfidController.prototype.getConf = function(varName) {
  var self = this
  //Perform your installation tasks here
}

rfidController.prototype.setConf = function(varName, varValue) {
  var self = this
  //Perform your installation tasks here
}
