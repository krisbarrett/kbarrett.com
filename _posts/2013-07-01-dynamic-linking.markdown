---
layout: post
title:  "Dynamic Linking"
date:   2013-07-01 15:22:00
categories: ['blog']
---
I feel like I have to re-learn dynamic linking in C about once a year, so I am documenting it here.  The comments in the Makefile describe the process.

Makefile:
{% highlight makefile %}
# these are variables
CC=gcc
CFLAGS=-Wall

# label: dependency1 dependency2 ... dependencyN
all: libhello main

libhello:
# -c means compile, but don't link. -fPIC means output position independent
# code, which is required for shared libraries.
	$(CC) $(CFLAGS) -c -fPIC hello.c
# -shared means create a shared object. -Wl,means pass options to the linker.
# In this case, "-soname libhello.so.1", which sets the internal name of the
# shared object.
	$(CC) $(CFLAGS) -shared -Wl,-soname,libhello.so.1 -o libhello.so.1.0 hello.o
	cp libhello.so.1.0 libhello.so.1
	cp libhello.so.1.0 libhello.so

main:
# -L. means look in the current directory for library files. -lhello means link
# with libhello.so.  -o means output the executable to main.
	$(CC) $(CFLAGS) -L. main.c -lhello -o main

install:
# copy the shared object to /opt/lib.  /opt/lib must be included in
# LD_LIBRARY_PATH for the executable to find the shared library at runtime.
	cp libhello.so.1.0 /opt/lib/
# The symbolic links are used for versioning purposes.
	ln -sf /opt/lib/libhello.so.1.0 /opt/lib/libhello.so.1
	ln -sf /opt/lib/libhello.so.1.0 /opt/lib/libhello.so

uninstall:
	rm /opt/lib/libhello*

clean:
	rm -rf main *.o *.so*
{% endhighlight %}

hello.h:
{% highlight c %}
void hello(char* name);
{% endhighlight %}

hello.c:
{% highlight c %}
#include "hello.h"
#include <stdio.h>

void hello(char* name)
{
   printf("hello %s\n", name);
}
{% endhighlight %}

main.c:
{% highlight c %}
#include "hello.h"

int main(int argc, char** argv)
{
   hello("kris");
   return 0;
}
{% endhighlight %}
