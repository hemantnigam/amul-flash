export interface LocalSoundItem {
  id: string;
  name: string;
  category: string;
  filename: string;
  fileSource: any;
  description: string;
}

export const LOCAL_ALARM_SOUNDS: LocalSoundItem[] = [
  {
    id: 'digital_clock_beep',
    name: 'Digital Clock Beep',
    category: 'Digital',
    filename: 'mixkit_alarm_digital_clock_beep_989.wav',
    fileSource: require('../music/mixkit_alarm_digital_clock_beep_989.wav'),
    description: 'Classic electronic clock repeating beep alarm',
  },
  {
    id: 'alert_alarm',
    name: 'Emergency Alert Siren',
    category: 'Alert',
    filename: 'mixkit_alert_alarm_1005.wav',
    fileSource: require('../music/mixkit_alert_alarm_1005.wav'),
    description: 'Pulsing emergency alarm siren for urgent drops',
  },
  {
    id: 'battleship_alarm',
    name: 'Battleship Alarm',
    category: 'Siren',
    filename: 'mixkit_battleship_alarm_1001.wav',
    fileSource: require('../music/mixkit_battleship_alarm_1001.wav'),
    description: 'Heavy duty naval alarm siren rhythm',
  },
  {
    id: 'digital_buzzer',
    name: 'Digital Clock Buzzer',
    category: 'Buzzer',
    filename: 'mixkit_digital_clock_digital_alarm_buzzer_992.wav',
    fileSource: require('../music/mixkit_digital_clock_digital_alarm_buzzer_992.wav'),
    description: 'High-pitch buzzer alarm for instant attention',
  },
  {
    id: 'spaceship_alarm',
    name: 'Spaceship Radar Alarm',
    category: 'Sci-Fi',
    filename: 'mixkit_spaceship_alarm_998.wav',
    fileSource: require('../music/mixkit_spaceship_alarm_998.wav'),
    description: 'Sci-Fi spaceship emergency klaxon',
  },
  {
    id: 'classic_winner',
    name: 'Classic Winner Fanfare',
    category: 'Celebration',
    filename: 'mixkit_classic_winner_alarm_1997.wav',
    fileSource: require('../music/mixkit_classic_winner_alarm_1997.wav'),
    description: 'Upbeat winning chime celebrating stock restock',
  },
  {
    id: 'sound_alert_hall',
    name: 'Hall Echo Alert',
    category: 'Echo',
    filename: 'mixkit_sound_alert_in_hall_1006.wav',
    fileSource: require('../music/mixkit_sound_alert_in_hall_1006.wav'),
    description: 'Reverberant warning chime echoing in hall',
  },
  {
    id: 'interface_hint',
    name: 'Subtle Interface Chime',
    category: 'Subtle',
    filename: 'mixkit_interface_hint_notification_911.wav',
    fileSource: require('../music/mixkit_interface_hint_notification_911.wav'),
    description: 'Gentle pleasant chime notification tone',
  },
];
