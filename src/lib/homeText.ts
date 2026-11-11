import { plural } from './format';
import { MISSION_DAYS, type MissionClock } from './phases';

/** The large title on the Home page. */
export function missionHeadline(clock: MissionClock): string {
  switch (clock.stage) {
    case 'before':
      return `${clock.daysToStart} ${plural(clock.daysToStart, 'day', 'days')} to the start`;
    case 'review':
      return 'Review day';
    case 'after':
      return 'Mission complete';
    case 'active':
      return `Day ${clock.day} of ${MISSION_DAYS}`;
  }
}

/** One short line about the DM count for a day. */
export function dmStatusText(dm: number, target: number): string {
  if (target <= 0) {
    return `${dm} ${plural(dm, 'DM', 'DMs')} sent.`;
  }
  if (dm >= target) {
    return dm === target ? 'Target met.' : `Target met, ${dm - target} more.`;
  }
  const left = target - dm;
  return `${left} more to the target.`;
}
