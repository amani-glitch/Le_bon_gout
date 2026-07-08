"""Seed Firestore with the Le Bon Goût (Le Bardo) menu (categories + products).

Run from the backend directory:  python -m scripts.seed
Idempotent: documents use stable ids and are overwritten on each run.

Prices are integer minor units of the Tunisian dinar (1 DT = 100). Product
images are local assets under /images/ (real Le Bon Goût photos).
"""
from __future__ import annotations

from datetime import UTC, datetime

from app.core.firestore import get_db

NOW = datetime.now(UTC)

CATEGORIES = [
    {"id": "pizza", "name": "Pizza (feu de bois)", "sort_order": 10, "is_active": True},
    {"id": "chapati", "name": "Chapati & Malfouf", "sort_order": 20, "is_active": True},
    {"id": "plats", "name": "Plats & Grillades", "sort_order": 30, "is_active": True},
    {"id": "gratins", "name": "Gratins & Pâtes", "sort_order": 40, "is_active": True},
    {"id": "drinks", "name": "Boissons", "sort_order": 50, "is_active": True},
]

# Each key maps to a real Le Bon Goût photo of that exact dish.
IMG = {
    "pizza_margherita": "/images/lebongout-pizza-margherita.jpg",
    "pizza_vege": "/images/lebongout-pizza-vege.jpg",
    "pizza_thon": "/images/lebongout-pizza-thon.jpg",
    "pizza_4fromages": "/images/lebongout-pizza-4fromages.jpg",
    "pizza_poulet": "/images/lebongout-pizza-poulet.jpg",
    "pizza_bongout": "/images/lebongout-pizza-bongout.jpg",
    "chapati_poulet": "/images/lebongout-chapati-poulet.jpg",
    "chapati_viande": "/images/lebongout-chapati-viande.jpg",
    "chapati_fromage": "/images/lebongout-chapati-fromage.jpg",
    "malfouf": "/images/lebongout-malfouf.jpg",
    "poulet": "/images/lebongout-poulet.jpg",
    "escalope": "/images/lebongout-escalope.jpg",
    "poisson": "/images/lebongout-poisson.jpg",
    "poisson_pane": "/images/lebongout-poisson-pane.jpg",
    "grillade": "/images/lebongout-grillade.jpg",
    "paella": "/images/lebongout-paella.jpg",
    "riz": "/images/lebongout-riz.jpg",
    "gratin": "/images/lebongout-gratin.jpg",
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
       "Sauce tomate, mozzarella et origan, cuite au feu de bois.", "pizza", "pizza_margherita", 1000, 1, PIZZA_EXTRAS),
    _p("prod_pizza_vegetarienne", "Végétarienne",
       "Poivrons, oignons, champignons, courgette et mozzarella.", "pizza", "pizza_vege", 1200, 2, PIZZA_EXTRAS),
    _p("prod_pizza_thon", "Thon",
       "Thon, olives, oignons et mozzarella.", "pizza", "pizza_thon", 1400, 3, PIZZA_EXTRAS),
    _p("prod_pizza_4fromages", "4 Fromages",
       "Mozzarella, gouda, gorgonzola et parmesan.", "pizza", "pizza_4fromages", 1400, 4, PIZZA_EXTRAS),
    _p("prod_pizza_poulet", "Pizza Poulet",
       "Poulet mariné, oignons rouges, mozzarella et sauce barbecue.", "pizza", "pizza_poulet", 1400, 5, PIZZA_EXTRAS),
    _p("prod_pizza_bongout", "Pizza Bon Goût",
       "La spéciale maison : jambon de dinde, champignons, fromage et olives.", "pizza", "pizza_bongout", 1600, 6, PIZZA_EXTRAS),

    # ── Chapati & Malfouf ─────────────────────────────────────────
    _p("prod_chapati_fromage", "Chapati Fromage",
       "Chapati gratiné au fromage, crudités et sauce, servi avec frites.", "chapati", "chapati_fromage", 650, 20),
    _p("prod_chapati_poulet", "Chapati Poulet",
       "Chapati gratiné, poulet, fromage, crudités et sauce.", "chapati", "chapati_poulet", 700, 21),
    _p("prod_malfouf", "Malfouf Grillé",
       "Pain malfouf grillé, garniture au choix, crudités et sauce.", "chapati", "malfouf", 700, 22),
    _p("prod_chapati_viande", "Chapati Viande",
       "Chapati gratiné, viande hachée, fromage et crudités.", "chapati", "chapati_viande", 800, 23),

    # ── Plats & Grillades ─────────────────────────────────────────
    _p("prod_quart_poulet", "1/4 Poulet Grillé",
       "Quart de poulet grillé, frites et salade.", "plats", "poulet", 1200, 30),
    _p("prod_riz_poulet", "Riz au Poulet",
       "Riz parfumé sauté au poulet et légumes.", "plats", "riz", 1200, 31),
    _p("prod_escalope_panee", "Escalope Panée",
       "Escalope panée croustillante, frites, pâtes et salade.", "plats", "escalope", 1300, 32),
    _p("prod_escalope_grillee", "Escalope Grillée",
       "Escalope de poulet grillée, riz ou frites et salade.", "plats", "poulet", 1300, 33),
    _p("prod_poisson_pane", "Filet de Poisson Pané",
       "Filet de poisson pané, riz, légumes grillés et salade.", "plats", "poisson_pane", 1500, 34),
    _p("prod_poisson_grille", "Poisson Grillé",
       "Poisson frais grillé, frites, pâtes et salade.", "plats", "poisson", 1800, 35),
    _p("prod_paella", "Paella Fruits de Mer",
       "Paella généreuse aux fruits de mer.", "plats", "paella", 2000, 36),
    _p("prod_grillade_mixte", "Grillade Mixte",
       "Assortiment de grillades (poulet, kefta, escalope), frites et salade.", "plats", "grillade", 2000, 37),

    # ── Gratins & Pâtes ───────────────────────────────────────────
    _p("prod_gratin_pates", "Gratin de Pâtes",
       "Pâtes gratinées au four, sauce crémeuse et fromage fondu.", "gratins", "gratin", 1100, 40),
    _p("prod_lasagne", "Lasagne Bolognaise",
       "Lasagnes à la bolognaise, béchamel et fromage gratiné.", "gratins", "gratin", 1300, 41),

    # ── Boissons ──────────────────────────────────────────────────
    _p("prod_eau", "Eau minérale 50cl", "Bouteille d'eau minérale.", "drinks", "boga", 150, 50),
    _p("prod_cafe", "Café Express", "Café express.", "drinks", "boga", 200, 51),
    _p("prod_soda", "Soda 33cl", "Canette bien fraîche.", "drinks", "boga", 250, 52),
    _p("prod_boga", "Boga Cidre 33cl", "La cidre tunisienne, bien fraîche.", "drinks", "boga", 250, 53),
    _p("prod_jus", "Jus d'orange frais", "Orange pressée minute.", "drinks", "boga", 500, 54),
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
