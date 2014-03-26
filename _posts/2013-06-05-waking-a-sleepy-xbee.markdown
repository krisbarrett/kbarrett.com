---
layout: post
title:  "Waking a Sleepy XBee"
date:   2013-06-05 18:11:00
categories: ['blog']
---
If you configure an XBee module to sleep for long duty cycles, it can be difficult to reconfigure it using X-CTU.  The trick is to wait until the XBee asserts its clear to send (CTS) signal before entering command mode.  Once in command mode, you can disable sleep mode.  The quick and dirty Python script shown below does just that.  Once sleep mode is disabled, you can use X-CTU to reconfigure the XBee.  Note that the script shown below doesn't write the configuration to flash, so you will have to reconfigure the XBee using X-CTU without removing power from the XBee.

{% highlight python %}
import serial
import time

ser = serial.Serial('/dev/tty.usbserial-A6005uzA')

# wait for xbee to wake up
while not ser.getCTS():
    print '.', 

# enter command mode
cmd = "+++"
print(cmd)
ser.write(cmd)
time.sleep(1)

# expecting OK
print(ser.read())
print(ser.read())

# disable sleep
cmd = "ATSM0\r"
print(cmd)
ser.write(cmd)
time.sleep(1)

# expecting OK
ser.read() # ignore the first byte
print(ser.read())
print(ser.read())

ser.close()
{% endhighlight %}
