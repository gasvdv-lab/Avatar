"""Gender-neutral base body specification."""

from copy import deepcopy
from body_proportions import DEFAULT_PROPORTIONS

def build_base_body_spec():
    p = deepcopy(DEFAULT_PROPORTIONS)
    return {
        "id": "colony_base_neutral_v013",
        "gender_presentation": "neutral",
        "style": "smooth_semi_anime",
        "build": "light_athletic",
        "pose": "A-pose",
        "purpose": "shared costume mannequin and future playable humanoid",
        "height_m": p["height_m"],
        "proportions": p,
    }
