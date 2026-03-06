'use client';

import { useScreen } from '@/context/ScreenContext';
import WelcomeScreen from '@/screens/WelcomeScreen';
import BarbershopChoiceScreen from '@/screens/BarbershopChoiceScreen';
import BarbershopAppointmentScreen from '@/screens/BarbershopAppointmentScreen';
import WalkInServiceScreen from '@/screens/WalkInServiceScreen';
import WalkInAvailabilityScreen from '@/screens/WalkInAvailabilityScreen';
import TattooScreen from '@/screens/TattooScreen';
import ConfirmationScreen from '@/screens/ConfirmationScreen';

function ScreenRouter() {
  const { screen } = useScreen();

  switch (screen) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'barbershop_choice':
      return <BarbershopChoiceScreen />;
    case 'barbershop_appointment':
      return <BarbershopAppointmentScreen />;
    case 'walk_in_service':
      return <WalkInServiceScreen />;
    case 'walk_in_availability':
      return <WalkInAvailabilityScreen />;
    case 'tattoo':
      return <TattooScreen />;
    case 'confirmation':
      return <ConfirmationScreen />;
    default:
      return <WelcomeScreen />;
  }
}

export default function KioskApp() {
  return <ScreenRouter />;
}
