import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';

describe('App component (Museum UI)', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders the Grand Hall view initially', () => {
    render(<App />);
    expect(screen.getByText(/Quick Stats/i)).toBeInTheDocument();
    expect(screen.getByText(/ENTER ARENA/i)).toBeInTheDocument();
  });

  it('navigates to Excavation view when clicking the bottom tab', () => {
    render(<App />);
    const excavationTab = screen.getByText('Excavation');
    fireEvent.click(excavationTab);
    expect(screen.getByText(/Excavation Artifact Pack/i)).toBeInTheDocument();
  });

  it('navigates to The Vault view when clicking the bottom tab', () => {
    render(<App />);
    const vaultTab = screen.getByText('The Vault');
    fireEvent.click(vaultTab);
    expect(screen.getByText(/Museum Encyclopedia/i)).toBeInTheDocument();
  });

  it('renders the Welcome Chest button when inventory is empty', () => {
    render(<App />);
    expect(screen.getByText(/Welcome Chest/i)).toBeInTheDocument();
  });

  it('shows error toast when trying to enter Arena without a deck', () => {
    render(<App />);
    const arenaBtn = screen.getByText(/ENTER ARENA/i);
    fireEvent.click(arenaBtn);
    expect(screen.getByText(/You must equip a Character card/i)).toBeInTheDocument();
  });

  it('navigates to Curator Profile view when clicking the profile button', () => {
    render(<App />);
    const profileBtn = screen.getByTitle('Curator Profile');
    fireEvent.click(profileBtn);
    expect(screen.getByText('Curator Profile', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText('Total Arena Stars Earned')).toBeInTheDocument();
    expect(screen.getByText('Collection Badges')).toBeInTheDocument();
    expect(screen.getByText('The Grand Curator')).toBeInTheDocument();
  });

  it('toggles Developer Cheat Mode when clicking Excavation Site header gear icon', () => {
    render(<App />);
    const excavationTab = screen.getByText('Excavation');
    fireEvent.click(excavationTab);
    
    // Cheat Mode should not be visible initially
    expect(screen.queryByText(/Sandbox Control Panel/i)).not.toBeInTheDocument();
    
    // Find and click the gear icon button
    const gearBtn = screen.getByTitle('Toggle Sandbox Control Panel');
    fireEvent.click(gearBtn);
    
    // Now the cheat mode menu should be visible
    expect(screen.getByText(/Sandbox Control Panel/i)).toBeInTheDocument();
    
    // Verify the buttons exist
    expect(screen.getByRole('button', { name: '+100k Coins' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+50k Insight' })).toBeInTheDocument();
  });
});
