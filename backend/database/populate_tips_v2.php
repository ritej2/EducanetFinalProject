<?php
require_once __DIR__ . '/../config/database.php';

$pdo = getDBConnection();

// Clear existing tips
$pdo->exec("TRUNCATE TABLE tips");

$tips = [
    // Santé (Category: sante)
    [
        'category' => 'sante',
        'title' => 'Hydratation régulière',
        'description' => 'Encouragez votre enfant à boire de l\'eau tout au long de la journée, surtout pendant les activités physiques.',
        'icon' => 'tint',
        'color' => 'gradient-sante-1'
    ],
    [
        'category' => 'sante',
        'title' => 'Lavage des mains',
        'description' => 'Enseignez la technique du lavage des mains pendant 20 secondes avant les repas pour éviter les maladies.',
        'icon' => 'hands-wash',
        'color' => 'gradient-sante-2'
    ],
    [
        'category' => 'sante',
        'title' => 'Santé dentaire',
        'description' => 'Un brossage des dents deux fois par jour est essentiel dès l\'apparition des premières dents de lait.',
        'icon' => 'tooth',
        'color' => 'gradient-sante-1'
    ],
    [
        'category' => 'sante',
        'title' => 'Sommeil réparateur',
        'description' => 'Un cycle de sommeil régulier renforce le système immunitaire de votre enfant.',
        'icon' => 'bed',
        'color' => 'gradient-sante-2'
    ],

    // Alimentation (Category: alimentation)
    [
        'category' => 'alimentation',
        'title' => 'Petit-déjeuner complet',
        'description' => 'Un bon petit-déjeuner avec des produits Délice (lait ou yaourt) aide à la concentration scolaire.',
        'icon' => 'utensils',
        'color' => 'gradient-alim-1'
    ],
    [
        'category' => 'alimentation',
        'title' => 'Cinq fruits et légumes',
        'description' => 'Essayez d\'intégrer une portion de légumes ou de fruits à chaque repas pour faire le plein de vitamines.',
        'icon' => 'apple-alt',
        'color' => 'gradient-alim-2'
    ],
    [
        'category' => 'alimentation',
        'title' => 'Goûter équilibré',
        'description' => 'Remplacez les biscuits industriels par un yaourt Délice et une poignée de fruits secs.',
        'icon' => 'ice-cream',
        'color' => 'gradient-alim-1'
    ],
    [
        'category' => 'alimentation',
        'title' => 'Moins de sucre',
        'description' => 'Limitez les boissons sucrées. Préférez les jus de fruits frais sans sucre ajouté.',
        'icon' => 'cookie-bite',
        'color' => 'gradient-alim-2'
    ],
    [
        'category' => 'alimentation',
        'title' => 'Le rôle du Calcium',
        'description' => 'Le lait et les produits laitiers Délice sont essentiels pour la croissance des os et des dents.',
        'icon' => 'glass-whiskey',
        'color' => 'gradient-alim-1'
    ],

    // Sommeil (Category: sommeil)
    [
        'category' => 'sommeil',
        'title' => 'Routine du soir',
        'description' => 'Instaurez un rituel calme (lecture avec 9isati) avant le coucher pour faciliter l\'endormissement.',
        'icon' => 'moon',
        'color' => 'gradient-sommeil'
    ],
    [
        'category' => 'sommeil',
        'title' => 'Pas d\'écrans avant de dormir',
        'description' => 'Évitez les tablettes et téléphones au moins 1 heure avant le sommeil pour préserver la mélatonine.',
        'icon' => 'tv',
        'color' => 'gradient-sommeil'
    ],
    [
        'category' => 'sommeil',
        'title' => 'Température de la chambre',
        'description' => 'Une chambre fraîche (environ 19°C) favorise un meilleur sommeil profond.',
        'icon' => 'thermometer-half',
        'color' => 'gradient-sommeil'
    ],

    // Éducation (Category: education)
    [
        'category' => 'education',
        'title' => 'Placer la lecture au centre',
        'description' => 'Utilisez les contes de 9isati pour développer le vocabulaire et l\'imagination de votre enfant.',
        'icon' => 'book',
        'color' => 'gradient-educ-1'
    ],
    [
        'category' => 'education',
        'title' => 'Encouragement positif',
        'description' => 'Félicitez les efforts fournis plutôt que seulement les résultats obtenus pour renforcer la motivation.',
        'icon' => 'thumbs-up',
        'color' => 'gradient-educ-2'
    ],
    [
        'category' => 'education',
        'title' => 'Environnement calme',
        'description' => 'Créez un espace dédié aux devoirs, loin des distractions bruyantes de la maison.',
        'icon' => 'pencil-alt',
        'color' => 'gradient-educ-1'
    ],
    [
        'category' => 'education',
        'title' => 'Autonomie progressive',
        'description' => 'Laissez votre enfant essayer par lui-même avant de l\'aider. Cela renforce sa confiance.',
        'icon' => 'graduation-cap',
        'color' => 'gradient-educ-2'
    ],

    // Développement (Category: developpement)
    [
        'category' => 'developpement',
        'title' => 'Activités artistiques',
        'description' => 'Le dessin et le coloriage développent la motricité fine et l\'expression émotionnelle.',
        'icon' => 'palette',
        'color' => 'gradient-dev'
    ],
    [
        'category' => 'developpement',
        'title' => 'Le jeu libre',
        'description' => 'Laissez votre enfant jouer sans règles précises pour stimuler sa créativité naturelle.',
        'icon' => 'puzzle-piece',
        'color' => 'gradient-dev'
    ],
    [
        'category' => 'developpement',
        'title' => 'Activités de plein air',
        'description' => 'Le jeu en extérieur est crucial pour le développement moteur et la santé globale.',
        'icon' => 'tree',
        'color' => 'gradient-dev'
    ],

    // Sécurité (Category: securite)
    [
        'category' => 'securite',
        'title' => 'Sécurité routière',
        'description' => 'Apprenez-lui à regarder à gauche et à droite avant de traverser la route, même dans les zones calmes.',
        'icon' => 'road',
        'color' => 'gradient-secu'
    ],
    [
        'category' => 'securite',
        'title' => 'Internet sécurisé',
        'description' => 'Utilisez des filtres de contrôle parental et discutez des dangers du partage de données personnelles.',
        'icon' => 'shield-alt',
        'color' => 'gradient-secu'
    ],
    [
        'category' => 'securite',
        'title' => 'Numéros d\'urgence',
        'description' => 'Apprenez à votre enfant les numéros d\'urgence essentiels et son adresse.',
        'icon' => 'phone-alt',
        'color' => 'gradient-secu'
    ]
];

$stmt = $pdo->prepare("INSERT INTO tips (category, title, description, icon, color) VALUES (?, ?, ?, ?, ?)");

echo "Connected to database.\n";
echo "Table truncated.\n";

foreach ($tips as $tip) {
    $stmt->execute([
        $tip['category'],
        $tip['title'],
        $tip['description'],
        $tip['icon'],
        $tip['color']
    ]);
    echo "Inserted tip: " . $tip['title'] . "\n";
}

echo "\nFinished populating " . count($tips) . " tips.\n";
