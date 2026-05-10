from decimal import Decimal
from typing import List, Dict
from models.models import ProjectMember, Revenue, Cost


class ProfitCalculator:
    def calculate_pool(self, total_revenue: Decimal, total_cost: Decimal, reserved_ratio: Decimal, share_ratio: Decimal) -> Decimal:
        reserved = total_revenue * reserved_ratio
        profit = total_revenue - total_cost - reserved
        pool = profit * share_ratio
        return max(pool, Decimal('0'))

    def calculate_weights(self, members: List[ProjectMember], delivery_scores: Dict[str, float],
                          peer_review_scores: Dict[str, float], hours: Dict[str, float]) -> Dict[str, Dict]:
        weights = {}
        total_weight = Decimal('0')
        for m in members:
            mid = str(m.member_id)
            d = Decimal(str(delivery_scores.get(mid, 0.5)))
            r = m.role_coefficient
            h = Decimal(str(hours.get(mid, 1.0)))
            p = Decimal(str(peer_review_scores.get(mid, 0.5)))
            w = d * Decimal('0.50') + r * Decimal('0.20') + h * Decimal('0.15') + p * Decimal('0.15')
            weights[mid] = {
                'weight': w,
                'detail': {'delivery_score': float(d), 'role_coefficient': float(r),
                          'participation_ratio': float(h), 'peer_review_score': float(p)}
            }
            total_weight += w
        return weights, total_weight

    def distribute(self, pool: Decimal, weights: Dict[str, Dict], total_weight: Decimal) -> List[Dict]:
        items = []
        for mid, w in weights.items():
            share = pool * w['weight'] / total_weight if total_weight > 0 else Decimal('0')
            items.append({
                'member_id': mid,
                'weight': float(w['weight']),
                'weight_detail': w['detail'],
                'amount': float(share.quantize(Decimal('0.01'))),
            })
        return items
