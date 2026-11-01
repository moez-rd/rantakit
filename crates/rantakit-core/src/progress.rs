use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use crate::error::{ErrorKind, Result};

/// How far an engine is with one file.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Progress {
    /// From 0 to 1, never going down.
    Fraction(f32),
    /// For engines that work page by page.
    Page { page: u32, pages: u32 },
}

/// Set from another thread to stop an engine. Clones share one flag.
#[derive(Debug, Clone, Default)]
pub struct CancelToken(Arc<AtomicBool>);

impl CancelToken {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn cancel(&self) {
        self.0.store(true, Ordering::Relaxed);
    }

    pub fn is_cancelled(&self) -> bool {
        self.0.load(Ordering::Relaxed)
    }
}

/// An engine's progress callback and cancel token together, so every
/// progress point is also a point where the engine stops when cancelled.
pub struct Tracker<'a> {
    progress: &'a mut dyn FnMut(Progress),
    cancel: &'a CancelToken,
    done: f32,
}

impl<'a> Tracker<'a> {
    pub fn new(progress: &'a mut dyn FnMut(Progress), cancel: &'a CancelToken) -> Self {
        Self {
            progress,
            cancel,
            done: 0.0,
        }
    }

    /// `Cancelled` once the cancel token is set.
    pub fn check(&self) -> Result<()> {
        if self.cancel.is_cancelled() {
            return Err(ErrorKind::Cancelled);
        }
        Ok(())
    }

    /// Stops when cancelled, otherwise reports `fraction`. A fraction below
    /// one already reported is raised to it, so progress never goes down.
    pub fn step(&mut self, fraction: f32) -> Result<()> {
        self.check()?;
        self.done = fraction.clamp(self.done, 1.0);
        (self.progress)(Progress::Fraction(self.done));
        Ok(())
    }

    /// Reports 1 once the Result is in place; too late to cancel.
    pub(crate) fn finish(&mut self) {
        self.done = 1.0;
        (self.progress)(Progress::Fraction(1.0));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn progress_never_goes_down() {
        let mut seen = Vec::new();
        let mut progress = |p| seen.push(p);
        let cancel = CancelToken::new();
        let mut tracker = Tracker::new(&mut progress, &cancel);

        tracker.step(0.5).unwrap();
        tracker.step(0.2).unwrap();
        tracker.step(7.0).unwrap();

        assert_eq!(
            seen,
            [0.5, 0.5, 1.0].map(Progress::Fraction),
            "a lower fraction is raised, a higher one capped at 1"
        );
    }

    #[test]
    fn cancelled_step_reports_nothing() {
        let mut calls = 0;
        let mut progress = |_| calls += 1;
        let cancel = CancelToken::new();
        let mut tracker = Tracker::new(&mut progress, &cancel);

        cancel.clone().cancel();

        assert_eq!(tracker.step(0.5), Err(ErrorKind::Cancelled));
        assert_eq!(calls, 0);
    }
}
