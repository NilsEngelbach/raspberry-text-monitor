# Onstage Text Monitor build with Raspberry PI

## Hardware

- Raspberry Pi
- (Old) Computer Monitor
- 3x Key Foot Switch
- Custom built box of wood


## How to install

### Start the application on boot of raspberry pi


```sh
sudo apt-get update
sudo apt-get install crontab
```

```sh
sudo crontab -e
```

```sh
# Edit this file to introduce tasks to be run by cron.
#
# Each task to run has to be defined through a single line
# indicating with different fields when the task will be run
# and what command to run for the task
#
# To define the time you can provide concrete values for
# minute (m), hour (h), day of month (dom), month (mon),
# and day of week (dow) or use '*' in these fields (for 'any').
#
# Notice that tasks will be started based on the cron's system
# daemon's notion of time and timezones.
#
# Output of the crontab jobs (including errors) is sent through
# email to the user the crontab file belongs to (unless redirected).
#
# For example, you can run a backup of all your user accounts
# at 5 a.m every week with:
# 0 5 * * 1 tar -zcf /var/backups/home.tgz /home/
#
# For more information see the manual pages of crontab(5) and cron(8)
#
# m h  dom mon dow   command
@reboot node /usr/src/raspberry-text-monitor/index.js &
```

### Start chrome on HDMI 1 (rotated) in kiosk mode

```sh
sudo apt-get update
sudo apt-get install chromium-browser
sudo apt-get install unclutter
```

`sudo nano /home/pi/.config/lxsession/LXDE-pi/autostart`

```sh
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash
point-rpi

@xrandr --output HDMI-1 --rotate right
# @xset s off
# @xset -dpms
@xset s 0 0
@xset s noblank
@xset s noexpose
@xset dpms 0 0 0
@chromium-browser --incognito --kiosk --disable-translate --disable-features=Translate --noerrdialogs --disable-infobars --no-first-run --start-fullscreen http://localhost:8080/

unclutter -idle 0
```

Info: Uncluccter is used to hide the mouse cursor.


## ENV

`.env`

```
## Customize display
#FONT_SIZE=
#REFRAIN_COLOR=
#BRIDGE_COLOR=
#HIGHLIGHT_COLOR=

## Use A,B,C Keys as input (foot switch defaults)
#KEYCODE_LEFT=65
#KEYCODE_MIDDLE=66
#KEYCODE_RIGHT=67

#PORT=8080
```