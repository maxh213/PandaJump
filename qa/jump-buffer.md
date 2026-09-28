# QA: Panda Jump on Phaser 4, slice: buffer a jump pressed just before landing

Use a desktop browser and keyboard. Steps 4 and 5 use `?clock=manual` and the console.

1. Run `npm ci` then `npm run dev` and open the URL it prints.
2. Jump, double jump near the top, then tap Space again just as the panda is about to touch the
   floor. **Expected:** the panda bounces straight off the floor into a full jump, as if you had
   tapped exactly on landing, with no puff, and you can still double jump in it.
3. Repeat but tap Space early, well before landing (about a third of a second). **Expected:** that
   tap does nothing; the panda lands and runs on.
4. Open `./?clock=manual&random=0.25,0.5,0`. In the console run `pandaJump.run.jump()`,
   `pandaJump.run.advance(580)`, `pandaJump.run.jump()`, `pandaJump.run.advance(820)`,
   `pandaJump.run.jump()`, `pandaJump.run.advance(100)`. **Expected:** `pandaJump.run.view().pandaBottom`
   is below 426 and `airPuff` is null. Repeat with `advance(760)` instead of 820 before the last
   jump. **Expected:** the panda ends on the floor (`pandaBottom` 426).
5. Buffer a press as in step 4, then press P (or Escape, or switch tab and back) before the panda
   lands and resume. **Expected:** the panda does not jump after the countdown; it lands and stays.
6. Buffer a press, then die before landing and restart. **Expected:** the new run starts with the
   panda on the floor and it does not jump by itself.
7. Hold Space for a second. **Expected:** one jump only; auto-repeat adds nothing.
8. Run `npx playwright test`. **Expected:** every scenario in `features/jump-buffer.feature`, and
   the rest of the suite, passes.
