"""Seed Firestore with the Le Bon Goût (Le Bardo) menu (categories + products).

Run from the backend directory:  python -m scripts.seed
Idempotent: documents use stable ids and are overwritten on each run.

Prices are integer minor units of the Tunisian dinar (1 DT = 100). Product
images are local assets under /images/.
"""
from __future__ import annotations

from datetime import UTC, datetime

from app.core.firestore import get_db

NOW = datetime.now(UTC)

CATEGORIES = [
    {"id": "pizza", "name": "Pizza (feu de bois)", "sort_order": 10, "is_active": True},
    {"id": "pasta", "name": "Pâtes & Risotto", "sort_order": 20, "is_active": True},
    {"id": "plats", "name": "Plats & Grillades", "sort_order": 30, "is_active": True},
    {"id": "entrees", "name": "Entrées & Salades", "sort_order": 40, "is_active": True},
    {"id": "desserts", "name": "Desserts", "sort_order": 50, "is_active": True},
    {"id": "drinks", "name": "Boissons", "sort_order": 60, "is_active": True},
]

IMG = {
    "pizza": "/images/lebongout-pizza.jpg",
    "escalope": "/images/lebongout-escalope.jpg",
    "poulet": "/images/lebongout-poulet.jpg",
    "poisson": "/images/lebongout-poisson.jpg",
    "paella": "/images/lebongout-paella.jpg",
    "plat": "/images/lebongout-plat.jpg",
    "boga": "/images/lebongout-boga.png",
}

PIZZA_EXTRAS = [
    {
        "id": "extras",
        "name": "Suppléments",
        "min": 0,
        "max": 6,
        "multi_select": True,
        "options": [
            {"id": "fromage", "name": "Fromage", "price_cents": 150},
            {"id": "thon", "name": "Thon", "price_cents": 200},
            {"id": "viande", "name": "Viande hachée", "price_cents": 250},
            {"id": "poulet", "name": "Poulet", "price_cents": 200},
            {"id": "champ", "name": "Champignons", "price_cents": 150},
            {"id": "olives", "name": "Olives", "price_cents": 100},
            {"id": "oeuf", "name": "Œuf", "price_cents": 100},
        ],
    }
]


def _p(pid, name, description, category, image_key, price, sort_order, extras=None):
    return {
        "id": pid,
        "name": name,
        "description": description,
        "category": category,
        "image_url": IMG.get(image_key),
        "base_price_cents": price,
        "sizes": [{"id": "one", "name": "Portion", "price_cents": price}],
        "topping_groups": extras or [],
        "sort_order": sort_order,
    }


PRODUCTS = [
    # ── Pizza (feu de bois) ───────────────────────────────────────
    _p("prod_pizza_margherita", "Margherita",
       "Sauce tomate, mozzarella et origan, cuite au feu de bois.", "pizza", "pizza", 1000, 1, PIZZA_EXTRAS),
    _p("prod_pizza_vegetarienne", "Végétarienne",
       "Légumes de saison, champignons, poivrons et mozzarella.", "pizza", "pizza", 1200, 2, PIZZA_EXTRAS),
    _p("prod_pizza_thon", "Thon",
       "Thon, oignons, olives, câpres et mozzarella.", "pizza", "pizza", 1400, 3, PIZZA_EXTRAS),
    _p("prod_pizza_4fromages", "4 Fromages",
       "Mozzarella, gouda, gorgonzola et parmesan.", "pizza", "pizza", 1400, 4, PIZZA_EXTRAS),
    _p("prod_pizza_bongout", "Pizza Bon Goût",
       "La spéciale maison : viande, poulet, olives, œuf et fromage.", "pizza", "pizza", 1600, 5, PIZZA_EXTRAS),
    _p("prod_pizza_fruits_mer", "Fruits de Mer",
       "Fruits de mer, ail, persil et mozzarella.", "pizza", "pizza", 1800, 6, PIZZA_EXTRAS),

    # ── Pâtes & Risotto ───────────────────────────────────────────
    _p("prod_pates_arrabiata", "Penne Arrabiata",
       "Sauce tomate épicée, ail et persil.", "pasta", "plat", 1100, 20),
    _p("prod_pates_bolognaise", "Penne Bolognaise",
       "Sauce bolognaise maison et parmesan.", "pasta", "plat", 1200, 21),
    _p("prod_pates_fruits_mer", "Pâtes Fruits de Mer",
       "Pâtes aux fruits de mer, sauce tomate parfumée.", "pasta", "paella", 1600, 22),
    _p("prod_risotto_fruits_mer", "Risotto Fruits de Mer",
       "Risotto crémeux aux fruits de mer.", "pasta", "paella", 1800, 23),

    # ── Plats & Grillades ─────────────────────────────────────────
    _p("prod_quart_poulet", "1/4 Poulet Grillé",
       "Quart de poulet grillé, frites et salade.", "plats", "poulet", 1200, 30),
    _p("prod_escalope_panee", "Escalope Panée",
       "Escalope panée croustillante, frites, pâtes et salade.", "plats", "escalope", 1300, 31),
    _p("prod_escalope_grillee", "Escalope Grillée",
       "Escalope de poulet grillée, frites et salade.", "plats", "poulet", 1300, 32),
    _p("prod_emince_poulet", "Émincé de Poulet",
       "Émincé de poulet sauté, riz ou frites et salade.", "plats", "poulet", 1400, 33),
    _p("prod_escalope_champignons", "Escalope aux Champignons",
       "Escalope, sauce crémeuse aux champignons, frites et salade.", "plats", "escalope", 1500, 34),
    _p("prod_poisson_grille", "Poisson Grillé",
       "Poisson frais grillé, frites, pâtes et salade.", "plats", "poisson", 1800, 35),
    _p("prod_grillade_mixte", "Grillade Mixte",
       "Assortiment de grillades, frites et salade.", "plats", "poulet", 2000, 36),
    _p("prod_paella", "Paella Fruits de Mer",
       "Paella généreuse aux fruits de mer.", "plats", "paella", 2000, 37),

    # ── Entrées & Salades ─────────────────────────────────────────
    _p("prod_brik", "Brik à l'Œuf",
       "Brik croustillante à l'œuf et au thon.", "entrees", "plat", 300, 40),
    _p("prod_soupe_poisson", "Soupe de Poisson",
       "Soupe de poisson maison.", "entrees", "plat", 600, 41),
    _p("prod_salade_tunisienne", "Salade Tunisienne",
       "Tomates, concombre, oignons, thon et œuf.", "entrees", "plat", 600, 42),
    _p("prod_salade_bongout", "Salade Bon Goût",
       "Salade composée de la maison, généreuse.", "entrees", "plat", 800, 43),

    # ── Desserts ──────────────────────────────────────────────────
    _p("prod_creme_caramel", "Crème Caramel", "Crème caramel maison.", "desserts", "plat", 500, 50),
    _p("prod_tiramisu", "Tiramisu", "Mascarpone, café et cacao.", "desserts", "plat", 600, 51),
    _p("prod_salade_fruits", "Salade de Fruits", "Fruits frais de saison.", "desserts", "plat", 600, 52),

    # ── Boissons ──────────────────────────────────────────────────
    _p("prod_eau", "Eau minérale 50cl", "Bouteille d'eau minérale.", "drinks", "boga", 150, 60),
    _p("prod_cafe", "Café Express", "Café express.", "drinks", "boga", 200, 61),
    _p("prod_soda", "Soda 33cl", "Canette bien fraîche.", "drinks", "boga", 250, 62),
    _p("prod_boga", "Boga Cidre 33cl", "La cidre tunisienne, bien fraîche.", "drinks", "boga", 250, 63),
    _p("prod_jus", "Jus d'orange frais", "Orange pressée minute.", "drinks", "boga", 500, 64),
]


def seed() -> None:
    db = get_db()

    for category in CATEGORIES:
        db.collection("categories").document(category["id"]).set(category)
    print(f"Seeded {len(CATEGORIES)} categories.")

    for product in PRODUCTS:
        doc = {**product, "is_active": True, "created_at": NOW, "updated_at": NOW}
        db.collection("products").document(product["id"]).set(doc)
    print(f"Seeded {len(PRODUCTS)} products.")


if __name__ == "__main__":
    seed()
