#!/bin/bash
set -e

/usr/sbin/sshd

exec /usr/sbin/apache2ctl -D FOREGROUND