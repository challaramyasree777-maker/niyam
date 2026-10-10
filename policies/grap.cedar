@id("BASE")
permit(principal, action, resource);

// ---------- CONSTRUCTION ----------
@id("C-S1-01")
forbid(principal, action == Action::"construction", resource)
when { context.stage >= 1 && !context.dust_controls };

@id("C-S1-02")
forbid(principal, action == Action::"construction", resource)
when { context.stage >= 1 && context.plot_sqm >= 500 && !context.portal_registered };

@id("C-S3-01")
forbid(principal, action == Action::"construction", resource)
when { context.stage >= 3 && context.listed_activity && !context.exempt_project };

@id("C-S4-01")
forbid(principal, action == Action::"construction", resource)
when { context.stage >= 4 && context.listed_activity && context.linear_project };

// ---------- VEHICLES ----------
@id("V-S1-01")
forbid(principal, action == Action::"vehicles", resource)
when { context.stage >= 1 && context.overaged };

@id("V-S3-01")
forbid(principal, action == Action::"vehicles", resource)
when {
  context.stage >= 3 && context.vehicle_type == "LMV" && !context.pwd_exempt &&
  (context.area == "delhi" || context.area == "hvd_district") &&
  ((context.fuel == "petrol" && context.bs <= 3) || (context.fuel == "diesel" && context.bs <= 4))
};

@id("V-S3-02")
forbid(principal, action == Action::"vehicles", resource)
when {
  context.stage >= 3 && context.vehicle_type == "MGV" && context.fuel == "diesel" &&
  context.bs <= 4 && context.registered_in_delhi && context.area == "delhi"
};

@id("V-S3-03")
forbid(principal, action == Action::"vehicles", resource)
when {
  context.stage >= 3 && (context.vehicle_type == "MGV" || context.vehicle_type == "LGV") &&
  context.fuel == "diesel" && context.bs <= 4 && !context.registered_in_delhi &&
  context.area == "delhi"
};

@id("V-S4-01")
forbid(principal, action == Action::"vehicles", resource)
when {
  context.stage >= 4 && context.vehicle_type == "HGV" && context.area == "delhi" &&
  !(context.fuel == "cng" || context.fuel == "lng" || context.fuel == "electric" ||
    (context.fuel == "diesel" && context.bs >= 6))
};

// ---------- WASTE BURNING ----------
@id("W-S1-01")
forbid(principal, action == Action::"waste_burning", resource)
when { context.stage >= 1 && context.open_burning };

@id("W-S1-02")
forbid(principal, action == Action::"waste_burning", resource)
when { context.stage >= 1 && context.illegal_dumping };

@id("W-S2-01")
forbid(principal, action == Action::"waste_burning", resource)
when { context.stage >= 2 && context.is_rwa && !context.heaters_provided };

// ---------- DG SETS ----------
// "older spec" = diesel and not compliant with GSR 804(E)
@id("D-S1-01")
forbid(principal, action == Action::"dg_sets", resource)
when { context.stage >= 1 && context.fuel == "diesel" && context.regular_power };

@id("D-S1-02")
forbid(principal, action == Action::"dg_sets", resource)
when {
  context.stage >= 1 && context.fuel == "diesel" && !context.gso_compliant &&
  context.dg_kva >= 1000 && !context.emission_control
};

@id("D-S1-03")
forbid(principal, action == Action::"dg_sets", resource)
when {
  context.stage >= 1 && context.fuel == "diesel" && !context.gso_compliant &&
  context.dg_kva >= 51 && context.dg_kva < 1000 &&
  !(context.dual_fuel || context.retrofit_ecd) &&
  !(context.gas_unavailable && context.emergency_service)
};

@id("D-S1-04")
forbid(principal, action == Action::"dg_sets", resource)
when {
  context.stage >= 1 && context.fuel == "diesel" && !context.gso_compliant &&
  context.dg_kva >= 23 && context.dg_kva < 51 &&
  !context.dual_fuel &&
  !(context.gas_unavailable && context.emergency_service)
};

@id("D-S1-05")
forbid(principal, action == Action::"dg_sets", resource)
when {
  context.stage >= 1 && context.fuel == "diesel" && !context.gso_compliant &&
  context.dg_kva < 23 && !context.emergency_service
};