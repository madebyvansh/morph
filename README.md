# Morph

A Chrome extension experiment exploring animated profile pictures and banners on X.

> **Status: Discontinued**
>
> Morph is no longer being developed or maintained. This repository documents the experiment and the technical lessons learned along the way.

## About The Project

Morph started with a simple idea: what if you could use animated profile pictures and banners on X?
The project explored whether a Chrome extension could make that possible by interacting with X's interface and working around its limitations.
What seemed like a small feature turned into an exploration of DOM manipulation, browser extensions, and the behavior of a complex, dynamic web application.

## Why I Stopped

Morph required users to authenticate with X.
After thinking through the product, I didn't feel comfortable asking people to connect their X account just to add an animated profile picture.
The feature wasn't worth the trust and risk involved.
So I decided not to move forward with Morph.
Not every project needs to ship. Sometimes the right outcome of building something is understanding why you shouldn't build it.

## What I Learned

### DOM Manipulation

Working with X's interface meant dealing with a dynamic DOM, changing elements, and UI updates that don't always behave like a traditional website.

### Chrome Extensions

I explored how Chrome extensions work, how they interact with web pages, and the challenges involved in building functionality on top of an existing platform.

### X's Platform Behavior

I learned more about:

* How X loads pages during navigation.
* How its interface updates as users move between pages.
* How X handles profile pictures.
* Why GIFs aren't accepted as profile pictures.
* The limitations of building features that depend on a platform you don't control.

### Product Decisions

The biggest lesson wasn't technical.
A feature can be interesting to build without being worth turning into a product.
Understanding that trade-off early is part of building.

## Built With

* JavaScript
* Chrome Extensions API
* DOM manipulation
* X web interface

## Project Status

This project is archived as an experiment.
There are no plans to release Morph as a public product or continue its development.

## Final Thoughts

Morph won't be launching.
But the time spent exploring it wasn't wasted.

It gave me hands-on experience with browser extensions, DOM manipulation, and the reality of building on top of someone else's platform.
The project ended before the product shipped, but the learning continues into the next one.
