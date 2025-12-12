interface RoverIconProps {
  size?: number;
  className?: string;
}

export function RoverIcon({ size = 24, className = '' }: RoverIconProps) {
  return (
    <img
      src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg"
      alt="Rover"
      width={size}
      height={size}
      className={className}
    />
  );
}