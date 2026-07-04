use rand::rngs::SmallRng;
use rand::{Rng, SeedableRng};
use wasm_bindgen::prelude::*;
use xiangting::{calculate_replacement_number, PlayerCount};

const WALL_SIZE: usize = 136;
const HAND_SIZE: usize = 14;
const NUM_KINDS: usize = 34;
/// Shanten of a 14-tile hand ranges from -1 (win) to 6 (seven pairs backstop).
const SHANTEN_BUCKETS: usize = 8;

struct Dealer {
    wall: [u8; WALL_SIZE],
    rng: SmallRng,
}

impl Dealer {
    fn new(seed: u64) -> Self {
        let mut wall = [0u8; WALL_SIZE];
        for (i, tile) in wall.iter_mut().enumerate() {
            *tile = (i / 4) as u8;
        }
        Self {
            wall,
            rng: SmallRng::seed_from_u64(seed),
        }
    }

    /// Deals 14 uniformly random tiles via partial Fisher-Yates and adds them
    /// to `counts`. The wall stays a permutation of all 136 tiles across
    /// calls, so it never needs to be reset.
    fn deal_into(&mut self, counts: &mut [u8; NUM_KINDS]) -> [u8; HAND_SIZE] {
        let mut tiles = [0u8; HAND_SIZE];
        for (i, tile) in tiles.iter_mut().enumerate() {
            let j = self.rng.random_range(i..WALL_SIZE);
            self.wall.swap(i, j);
            let kind = self.wall[i];
            *tile = kind;
            counts[kind as usize] += 1;
        }
        tiles
    }
}

fn shanten(counts: &[u8; NUM_KINDS]) -> i8 {
    // counts always holds a valid 14-tile hand here, so this cannot fail
    let replacement = calculate_replacement_number(counts, &PlayerCount::Four).unwrap();
    replacement as i8 - 1
}

#[wasm_bindgen]
pub struct DealResult {
    tiles: Vec<u8>,
    shanten: i8,
}

#[wasm_bindgen]
impl DealResult {
    #[wasm_bindgen(getter)]
    pub fn tiles(&self) -> Vec<u8> {
        self.tiles.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn shanten(&self) -> i8 {
        self.shanten
    }
}

/// Deals a single 14-tile hand (dealer's starting hand) and returns the
/// sorted tile kinds (0-33) with its shanten number.
#[wasm_bindgen]
pub fn deal(seed: u64) -> DealResult {
    let mut dealer = Dealer::new(seed);
    let mut counts = [0u8; NUM_KINDS];
    let mut tiles = dealer.deal_into(&mut counts);
    tiles.sort_unstable();
    DealResult {
        shanten: shanten(&counts),
        tiles: tiles.to_vec(),
    }
}

#[wasm_bindgen]
pub struct SimResult {
    deals: u32,
    shanten_counts: Vec<u32>,
    winners: Vec<u8>,
}

#[wasm_bindgen]
impl SimResult {
    #[wasm_bindgen(getter)]
    pub fn deals(&self) -> u32 {
        self.deals
    }

    /// Occurrences per shanten number; index 0 is a win (-1), index 7 is 6 shanten.
    #[wasm_bindgen(getter)]
    pub fn shanten_counts(&self) -> Vec<u32> {
        self.shanten_counts.clone()
    }

    /// Winning hands, 14 sorted tile kinds each, concatenated.
    #[wasm_bindgen(getter)]
    pub fn winners(&self) -> Vec<u8> {
        self.winners.clone()
    }
}

/// Repeatedly deals up to `max_deals` hands. Stops early after the first
/// winning hand (tenhou) when `stop_on_win` is set.
#[wasm_bindgen]
pub fn simulate(seed: u64, max_deals: u32, stop_on_win: bool) -> SimResult {
    let mut dealer = Dealer::new(seed);
    let mut counts = [0u8; NUM_KINDS];
    let mut shanten_counts = vec![0u32; SHANTEN_BUCKETS];
    let mut winners = Vec::new();
    let mut deals = 0u32;

    while deals < max_deals {
        let tiles = dealer.deal_into(&mut counts);
        let s = shanten(&counts);
        deals += 1;
        shanten_counts[(s + 1) as usize] += 1;

        let won = s == -1;
        if won {
            let mut sorted = tiles;
            sorted.sort_unstable();
            winners.extend_from_slice(&sorted);
        }

        for &kind in &tiles {
            counts[kind as usize] -= 1;
        }

        if won && stop_on_win {
            break;
        }
    }

    SimResult {
        deals,
        shanten_counts,
        winners,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn counts_from(tiles: &[u8]) -> [u8; NUM_KINDS] {
        let mut counts = [0u8; NUM_KINDS];
        for &tile in tiles {
            counts[tile as usize] += 1;
        }
        counts
    }

    #[test]
    fn deal_is_reproducible() {
        let a = deal(42);
        let b = deal(42);
        assert_eq!(a.tiles, b.tiles);
        assert_eq!(a.shanten, b.shanten);
    }

    #[test]
    fn deal_returns_valid_sorted_hand() {
        for seed in 0..100 {
            let result = deal(seed);
            assert_eq!(result.tiles.len(), HAND_SIZE);
            assert!(result.tiles.is_sorted());
            assert!((-1..=6).contains(&result.shanten));
            let counts = counts_from(&result.tiles);
            assert!(counts.iter().all(|&c| c <= 4));
        }
    }

    #[test]
    fn wall_stays_valid_across_many_deals() {
        let mut dealer = Dealer::new(1);
        let mut counts = [0u8; NUM_KINDS];
        for _ in 0..10_000 {
            let tiles = dealer.deal_into(&mut counts);
            assert!(counts.iter().all(|&c| c <= 4));
            assert_eq!(counts.iter().map(|&c| c as usize).sum::<usize>(), HAND_SIZE);
            for &kind in &tiles {
                counts[kind as usize] -= 1;
            }
        }
    }

    #[test]
    fn shanten_of_known_hands() {
        // 123m456p789s11222z: complete standard hand
        let win = counts_from(&[0, 1, 2, 12, 13, 14, 24, 25, 26, 27, 27, 28, 28, 28]);
        assert_eq!(shanten(&win), -1);

        // 11223344556677m: complete seven pairs
        let chiitoi = counts_from(&[0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
        assert_eq!(shanten(&chiitoi), -1);

        // 19m19p19s1234567z + 1m: complete thirteen orphans
        let kokushi = counts_from(&[0, 0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33]);
        assert_eq!(shanten(&kokushi), -1);

        // 123m456p789s11z225z: tenpai after discarding 5z (shanpon wait)
        let tenpai = counts_from(&[0, 1, 2, 12, 13, 14, 24, 25, 26, 27, 27, 28, 28, 31]);
        assert_eq!(shanten(&tenpai), 0);
    }

    #[test]
    fn simulate_counts_every_deal() {
        let result = simulate(7, 50_000, false);
        assert_eq!(result.deals, 50_000);
        assert_eq!(result.shanten_counts.iter().sum::<u32>(), 50_000);
        assert_eq!(result.winners.len() % HAND_SIZE, 0);
        assert_eq!(
            result.shanten_counts[0] as usize * HAND_SIZE,
            result.winners.len()
        );
    }

    #[test]
    fn simulate_is_reproducible() {
        let a = simulate(123, 10_000, false);
        let b = simulate(123, 10_000, false);
        assert_eq!(a.deals, b.deals);
        assert_eq!(a.shanten_counts, b.shanten_counts);
        assert_eq!(a.winners, b.winners);
    }

    // Seed found by scanning: the first winning hand appears at deal 12,530,
    // keeping this test fast even in debug builds.
    const WINNING_SEED: u64 = 4;
    const WINNING_DEAL: u32 = 12_530;

    #[test]
    fn simulate_stops_on_win() {
        let result = simulate(WINNING_SEED, WINNING_DEAL + 10_000, true);
        assert_eq!(result.deals, WINNING_DEAL);
        assert_eq!(result.winners.len(), HAND_SIZE);
        assert_eq!(result.shanten_counts[0], 1);
        let counts = counts_from(&result.winners);
        assert_eq!(shanten(&counts), -1);
    }
}
