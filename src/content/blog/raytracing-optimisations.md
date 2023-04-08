---
title: "Raytracing : From 6 minutes to 5 seconds"
pubDatetime: 2023-04-11
featured: false
draft: false
tags:
  - optimisation
  - raytracing
  - english
  - sae
description: Technical blogpost on how I optimised a Raytracer using various methods.
---

During the second module of the third year at SAE Institute, we had to do a project in a naive way, that we would then optimize.

Since I enjoy computer graphics, I decided to follow [Ray Tracing in One Weekend](https://raytracing.github.io/books/RayTracingInOneWeekend.html) written by Peter Shirley.
And since I also enjoy Rust, it's the language I chose for this project.
Although there are some Rust specific stuff, most of the optimisations can be applied in any programming language, so don't be scared if you don't know any Rust.

You can see the code on this repo : <https://github.com/St0wy/raytracing/>

## Table of contents

## The project

When optimizing, it can be sometimes a good idea to change what the program does.
For example, you could reduce the number of objects in a scene, so that it can be computed faster.
In this case, I wanted to keep the image intact.
The goal was to have the same image before and after the optimisations.

To make this possible, in decided on four scenes that would showcase the different features of the raytracer and how some optimisations could impact different cases.

They are all rendered on a 400x400 image with 200 samples per pixel and a ray depth of 30.

Here are all of the scenes :

### Three Spheres

This is a scene with three spheres, that are all of a different material.
From front to back :

1. Dielectric (glass)
2. Metalic
3. Lambertian (diffuse)

![Scene with three spheres](/raytracing-optimisations/three-spheres.png)

### Big Scene

A big scene with a lot of spheres (~400, some are outside of the camera) of different materials. The one on the ground has a checker texture.

The blurry spheres on the front are here to simulate motion blur.
It's like they're moving while the picture is being taken.

![big raytraced scene with hundreds of balls](/raytracing-optimisations/big-scene.png)

### Cornell Box

This is an image that is often reproduced to try the capacites of the lighting simulation of a renderer.
It's a nice test to see the reflexion of the green wall onto the white box.
Usually the boxes are rotated, but I didn't implement that in my renderer.

![Raytraced image of the cornell box](/raytracing-optimisations/cornell-box.png)

### Perlin and Earth

In this image, there is a big sphere as the ground, that has a perlin noise texture.
The sphere on top has an image texture of the earth.

![image of a sphere with perlin noise texture and above it a sphere with a texture that looks like the earth](/raytracing-optimisations/perlin-and-earth.png)

## Naive Implementation

To have a base to compare to, I will show you the time it take to run each scene :

| Three Spheres | Big Scene | Cornell Box | Perlin and Earth |
| ------------- | --------- | ----------- | ---------------- |
| 3624,3 ms     | 405330 ms | 35313 ms    | 18502 ms         |

I measured these using the [Criterion.rs](https://github.com/bheisler/criterion.rs) benchmarking library.

In this case, the project is implemented as an almost exact copy of the c++ code provided, but translated in Rust.

As you can see, there is a big hit on performance from the amount of objects in the big scene. We'll see how we can reduce that with the first optimisation.

## Data Oriented

### What's Data Oriented Programming

If you're not sure what [Data Oriented Programming](https://blog.klipse.tech/databook/2020/09/25/data-book-chap0.html) means, I'll will try to summarize it for you.

It's basically centered around the idea that the way the data is layed out in your memory, can (and will) impact performance.

When you code in an data oriented way, one of the things that you try to do is having as much data as possible that's contiguous.
For example if you have an array of objects that you want to process, you try to avoid having an array of pointers to these objects, but instead you use an array to these objects.

> But this will ruin inheritence !

Yes ! That's the point !
Since inheritence makes you go through a [v-table](https://stackoverflow.com/a/3004555/12330678), it has an heavy impact on performances.
This is where concepts such as "[Composition over inheritance](https://en.wikipedia.org/wiki/Composition_over_inheritance)" come from.

> So you're telling that you remove inheritance, but I thought that Rust didn't have inheritance ?

Well, kinda. You can't inherit from an other struct in Rust. Structs can only implement traits.
But, you can have a vector of the equivalent of an unique pointer in c++ of traits.

```cpp
// C++
std::vector<std::unique_ptr<Hittable>> hittables;
```

```rust
// rust
let hittables: Vec<Box<dyn Hittable>>;
```

Since Rust wants to make it obvious when you have a cost in its abstractions, it asks you to add the `dyn` keyword.
It stands for "dynamic dispatch", which is the process by which it's going to get the correct object.

### Implementation

> Okay, so now how do you have multiple `Hittable` types ?

Well, this is kind of the ugly part. The way I implemented it in my code, is by having multiple vectors.

```rust
let spheres: Vec<Sphere>;
let moving_sphere: Vec<MovingSphere>;
```

This makes it so that I must add quite a lot of boilerplate when I add a new object, but the speed improvement is hopefully worth it.
There may be a better way to implement it, but in my case the program was small enough that it wasn't worth the effort to investigate this further.

### Speed

So, does it really improve performance ?
Well let's look at the benchmark results.

|                   | Three Spheres | Big Scene | Cornell Box | Perlin and Earth |
| ----------------- | ------------- | --------- | ----------- | ---------------- |
| **Naive**         | 3624,3 ms     | 405330 ms | 35313 ms    | 18502 ms         |
| **Data Oriented** | 3682,6 ms     | 282410 ms | 33221 ms    | 18627 ms         |

As you can see there, for the scenes where there aren't that many objects, it has a tendency to be slower (at most 1.6%).
But for the scene with a lot of objects, there is a 30% increase in speed !
So if the objective is to have a lot of objects, this is the right path.

## Boundary Volume Heirarchy

This point is actually covered in [Ray Tracing: The Next Week](https://raytracing.github.io/books/RayTracingTheNextWeek.html#boundingvolumehierarchies), so I'm not going to go in details on what it is and how it works.
I will explain how I implemented it in a data oriented way though !

The basic idea is that we divide the world in a binary tree where each node has an AABB (axis aligned bounding box) that surrounds every objects that's a child of it.
This alows to greaty speed up the collision check rays, since we don't have to check agaisnt every object in the scene.

### Implementation

So, as I said beffore, the truth is a bit ugly when it comes to my data oriented code, but here is the idea of how I implemented it.

So each nodes need to have either a pointer to a node, or to one of the types that can be rendered.

For this, I decided to have a type that would be an index to a hittable object.
This type has an index in the array of the object and an enum that say which type it is.
The BVH node then has two of these objects for its children.

```rust
pub enum HittableObjectType {
    Sphere,
    MovingSphere,
    XyRectangle,
    XzRectangle,
    YzRectangle,
    AabbBox,
    BvhNode,
}

pub struct HittableObjectIndex {
    pub object_type: HittableObjectType,
    pub index: usize,
}

pub struct BvhNode {
    left: HittableObjectIndex,
    right: HittableObjectIndex,
    aabb: Aabb,
}
```

And then there is a recursive method that traverses the array of BVH nodes.
The first node of this array is always the root of the scene.

### Speed

So, did this really bring any speedups ?

|                   | Three Spheres | Big Scene | Cornell Box | Perlin and Earth |
| ----------------- | ------------- | --------- | ----------- | ---------------- |
| **Data Oriented** | 3682,6 ms     | 282410 ms | 33221 ms    | 18627 ms         |
| **BVH**           | 4668,2 ms     | 55679 ms  | 46857 ms    | 19210 ms         |

Well, this is where we say "it depends".
Although the big scene has an 80% speedup, the cornell box is 41% slower and the three spheres are 26% slower.

So again, if we wanted to render small scenes, this would not be a good idea, but for big scenes, it is. The BVH is kept for subsequent tests, but in a more real use case, it would be pertinent to wonder how the project would be used.

## Multithreading

At the end of "Ray Tracing in One Weekend", one of the exercises left to the reader is to multithread the raytracer. This is where we do that !

### Implementation

Thanks to Rust's [Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html) and the crate [Rayon](https://github.com/rayon-rs/rayon) this was extremly easy to do !

Inside of my render function, I replaced the for loop to a `flat_map` call on a range.
I could then call Rayon's `into_par_iter()` on the range, to convert the iterator to a parallel iterator and boom, multithreading !

```rust
pub fn render(scene: &Scene, image_width: usize, image_height: usize) -> Vec<u8> {
    (0..image_height)
        .into_par_iter()
        .rev()
        .flat_map(|j| {
            // Do something...
        }).collect()
}
```

### Speed

TODO: Speed
