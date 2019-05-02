#!/bin/bash

echo "Installing rfid controller Dependencies"
sudo apt-get update
# required because we need "make"
sudo apt-get -y install build-essential

# prepare drivers
cd node_modules/wiringpi-node/
sudo ./install.sh

# enable driver
grep -qxF 'dtparam=spi=on' /boot/config.txt || echo 'dtparam=spi=on' >> /boot/config.txt

echo " "
echo "----------------------------------------"
echo " "
echo "              IMPORTANT!"
echo " You have to restart your Raspberry PI"
echo " "
echo "----------------------------------------"
echo " "

#requred to end the plugin install
echo "plugininstallend"
