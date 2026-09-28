# QA: Panda Jump on Phaser 4, slice: tilting the panda with its vertical speed

Use a desktop browser with dev tools.

1. Run `npm ci` then `npm run dev` and open the URL it prints. **Expected:** the panda stands and runs on the floor upright, angle 0, same as before this slice.
2. Jump. **Expected:** the instant the panda leaves the floor its nose tilts up (rotates so the front points upward), most sharply right at takeoff.
3. Keep watching the same jump. **Expected:** as the panda rises the nose-up tilt eases off, passing back through level around the top of the arc, then tilts nose-down as it starts to fall, ending level again the moment it lands.
4. Double jump near the top of the first jump. **Expected:** the tilt snaps back to a sharp nose-up angle the instant the second jump fires, then eases through level and into nose-down again on the way back to the floor, the same way as step 2–3.
5. Let the panda fall for a long, uninterrupted stretch, e.g. by opening the console and running `window.pandaJump.run.advance(2000)` right after a jump. **Expected:** the nose-down tilt does not keep increasing forever; it stops steepening once it is clearly diving, well short of pointing straight down.
6. In the console, run `window.pandaJump.run.view().pandaAngle` at a few moments: standing still, right after `window.pandaJump.run.jump()`, and after `window.pandaJump.run.advance(600)`. **Expected:** the values read 0, -25, and a positive number no greater than 25.
7. Watch the panda's position closely while it is level (angle 0), both standing and mid-air. **Expected:** it sits at exactly the same place on screen as before this slice — the tilt does not shift where the panda appears to stand or land.
8. Deliberately let the panda hit a column. **Expected:** the game-over screen still shows the panda upside down, not tilted — the death flip from the earlier mid-air-death slice is unchanged.
9. Run `npx playwright test`. **Expected:** every scenario in `features/panda-tilt.feature` has a passing test, and every other feature file still passes unchanged.
