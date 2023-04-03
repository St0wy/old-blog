---
title: Tool for AI Path
pubDatetime: 2022-12-19
featured: false
draft: false
tags:
  - unreal
  - english
  - sae
description: Explanation on how I implemented an AI Path tool in Unreal.
---

For the last part of the GPR5100 module at SAE Institute,
we were asked to create a tool for the 3rd-year students that are making a game on Unreal Engine 5 called Sub Caelo.
What I had to do was a tool to create the path of AIs.

## Sub Caelo

Sub Caelo is a local multiplayer pod-racing game.
It is a "remake" of the 3rd year project that previous students had to make on the [Neko Engine](https://github.com/EliasFarhan/NekoEngine), "Air Racer".

![Air Racer](/ai-path-tool/AirRacer.png)

## The tool

The tool I had to make was one where the user could place a curve in a scene,
that would represent the ideal path of the other pods that are controlled by AI.

After placing the spline, I had to add an object that would go along it to visualise that trajectory.

This is what the final tool looks like:

<video width="640" height="480" loop muted autoplay >
  <source src="/ai-path-tool/aiPathTool.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Implementation

### The spline

The first step was to have a way to add the line that the AI would follow.

For this, the easiest way is to use the integrated spline tool inside of Unreal Engine.
I created a blueprint actor, called _AISplinePathBP_ to hold it, where I just added the spline component in the Components tab.

![Spline](/ai-path-tool/splineObject.png)

After this, I ticked the _Closed Loop_ box in the Details tab in the Spline section.

![Closed Loop](/ai-path-tool/UnrealEditor_2cggt6zvNC.png)

This is so that the spline always forms a loop, which is nice since the circuits are loops.

That's all for the spline, we will now make an actor that follows it to visualize what it would look like.

### The follower

#### Inputs / Output

The inputs of the follower are :

- The spline
- The time it take to go around the spline

The output is :

- The follower moving along the spline

#### The blueprint

The first thing to do is to add a shape for this object.
I choose a cylinder, so we can see where it "looks" at.

![Cylinder 2](/ai-path-tool/cylinder2.png)

![Cylinder 1](/ai-path-tool/cylinder1.png)

Then, we need two variables:

- one to store a reference to the spline
- one to store the time it takes for the object to go around the spline in second

![variables](/ai-path-tool/variables.png)

The spline reference is then set in the _BeginPlay_ event.
We only set it if the variable is not valid, so that it can be set by the user.
This is useful if we have multiple followers and/or multiple splines.
Then we check again if it's valid to make sure we found something, otherwise, we warn the user.

![Spline ref](/ai-path-tool/splineRef.png)

After that, we create a custom event called _Move Object_ that is called after the reference is set.

![move object call](/ai-path-tool/moveObjectCall.png)

But how are we going to move that object?
The basic idea is that we are going to use a _Timeline_ node.
It will allow us to define a curve on how fast the object goes along the spline depending on where it is.
It will send a progression from 0 to 1 in the time set in _Time To Complete_ and we will linearly interpolate
this value with the length of the spline, which will then allow us to compute a location and rotation along the spline
that will be applied to our actor.

But how do we do that? Well first we have to set the play rate of our timeline.
This will make it last the duration we have set.
For this we divide 1 by _Time To Complete_ and feed that value to the _Set Play Rate_ node.
We can add a Timeline node after this too.

![Begin move object](/ai-path-tool/beginMoveObject.png)

Now we need to setup the timeline to send a value from 0 to 1.
For this we add two keys, one at 0,0 and one at 1,1.
It is also possible to right-click on the keys and to set them to auto.
This will make it so the actor will slowly accelerate at the beginning and slowly slow down when it arrives at the end.

The curve should look like this:

![curve](/ai-path-tool/curve.png)

Then there are two things we want to do, restart _Move Object_ once the timeline finishes
and set the actor transform on the update event.

We want the position along the spline, for that we lerp from 0 to the spline length and with _Move Track_ as input value.
Then we use the resulting value in _Get Location at Distance Along Spline_ and _Get Rotation at Distance Along Spline_,
which are then used in a _Set Actor Transform_ node.

![End move object](/ai-path-tool/endMoveObject.png)

## Conclusion

And with that, we are done. We just need to add both of out blueprints in a world, and our cylinder will follow the spline.
Thanks to Unreal Engine, the spline was really easy to implement, and most of the work was with having an object go along it.
