# VolleyTakt Live

**Browser-based live volleyball scouting for the VolleyTakt project.**

[Homepage](https://volleytakt.de) · [Documentation](https://docs.volleytakt.de) · [Open Live App](https://live.volleytakt.de)

VolleyTakt Live is the browser-based scouting interface for capturing volleyball actions directly during a match.

It is designed for fast touch operation on tablets, smartphones and laptops and shares its data model with VolleyTakt Desktop.

> **Development status:** Preview software. Features, UI and data structures may still change.

## What is VolleyTakt?

VolleyTakt is a free and open-source toolset for volleyball scouting, statistics and video analysis.

The workflow is:

**Scout live → understand the data → verify it in video**

The ecosystem consists of:

- **VolleyTakt Live** – browser-based live scouting
- **VolleyTakt Desktop** – deeper analysis and video review
- **VolleyTakt Docs** – user documentation

## Live scouting concept

The detailed scouting workflow follows:

**WHO → WHAT → HOW → WHERE**

This helps the scout enter actions in a fixed and memorable order.

Examples:

- `P5 → Reception → good`
- `P4 → Attack → good → to P1`

The scout primarily works with court positions, while the stored action remains linked to a stable player ID for later analysis.

## Simple and detailed scouting

VolleyTakt Live supports different scouting depths.

### Simple scouting

Focused on fast capture with large touch targets and minimal interaction.

Typical information:

- player
- action
- evaluation
- match flow

### Detailed scouting

Adds additional context such as:

- origin position
- target position
- extended evaluation
- rally context
- game phase
- expanded court zones

Shared UI changes are intended to apply consistently to both simple and detailed scouting unless explicitly specified otherwise.

## Court positions and zones

The standard volleyball positions are:

- P1
- P2
- P3
- P4
- P5
- P6

Detailed scouting can additionally use:

- P7 between P4 and P5
- P8 between P3 and P6
- P9 between P2 and P1

P7 to P9 are **documentation zones only** and are not rotation positions.

They help describe where a ball was played from or where it was directed.

## Rally-based data

Each rally receives a unique rally ID.

Actions inside the rally remain linked so they can later be:

- reviewed together
- corrected consistently
- analyzed by game phase
- connected to video
- used for rally-based clips

## K1 / K2 / K3

VolleyTakt can distinguish tactical game phases:

- **K1** – own reception / side-out phase
- **K2** – break-point / defensive phase after own serve
- **K3** – defense against an opponent attack within an ongoing rally

## Rotation and match state

VolleyTakt Live is designed to track relevant match state, including:

- starting lineup
- rotations
- own and opponent lineup context
- service possession
- set score
- substitutions
- libero handling
- undo / corrections
- live protocol

## Offline-first

A live scouting session should not depend on a reliable internet connection.

VolleyTakt Live therefore follows an offline-first approach and stores required session data locally where possible.

## Video and camera integration

Video timestamps are part of the shared VolleyTakt concept.

The long-term goal is to connect live scouting directly with camera recording and later video review.

The primary planned camera integration is the **DJI Osmo Action 4** via Bluetooth, with a modular architecture for additional camera families.

## Related projects

### VolleyTakt Desktop

Repository:

https://github.com/IZ23/VolleyTakt

### Documentation

https://docs.volleytakt.de

### Project website

https://volleytakt.de

## Open Source

VolleyTakt is intended to remain free, open source and self-hostable where applicable.

Issues, ideas and contributions are welcome through GitHub.

## Privacy philosophy

VolleyTakt aims to minimize unnecessary data processing:

- no advertising
- no mandatory user tracking
- offline-first operation
- local data storage where possible
- optional self-controlled synchronization

## License

See the license file in this repository for the applicable terms.

---

**VolleyTakt**  
Volleyball verstehen. Live scouten. Im Video prüfen.
