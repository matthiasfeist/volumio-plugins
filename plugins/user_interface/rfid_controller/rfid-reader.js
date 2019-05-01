'use strict'
const mfrc522 = require('mfrc522-rpi')
mfrc522.initWiringPi(0)

module.exports = function(onCardFoundFunction, logger) {
  setInterval(function() {
    mfrc522.reset()

    let response = mfrc522.findCard()
    if (!response.status) {
      logger.debug('RFID CONTROLLER PLUGIN: No card on reader')
      return
    }

    // Get the UID of the card
    response = mfrc522.getUid()
    if (!response.status) {
      logger.error(
        'RFID CONTROLLER PLUGIN: Error reading the UID of the current card'
      )
      return
    }

    var uid = response.data
    if (uid.length > 0) {
      uid = uid.map(byte => byte.toString(32)).join('')
    }

    onCardFoundFunction(uid)
  }, 500)
}
